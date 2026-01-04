import { z } from 'zod'

// Types
export interface ScanResult {
  vulnerable: boolean
  confidence: 'high' | 'medium' | 'low'
  usesRsc: boolean
  framework: string | null
  detectedVersion: string | null
  httpStatus: number | null
  errorSignature: string | null
  message: string
  durationMs: number
}

// URL validation
const urlSchema = z.string().url().refine((url) => {
  const parsed = new URL(url)
  // Block private IPs
  const privatePatterns = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^0\./,
    /^169\.254\./,
  ]
  return !privatePatterns.some(p => p.test(parsed.hostname))
}, 'Private/local URLs are not allowed')

// Normalize URL for caching
export function normalizeUrl(url: string): string {
  const parsed = new URL(url)
  return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${parsed.pathname.replace(/\/$/, '') || '/'}`
}

// Main detection function
export async function detectReact2Shell(url: string): Promise<ScanResult> {
  const startTime = Date.now()

  const result: ScanResult = {
    vulnerable: false,
    confidence: 'low',
    usesRsc: false,
    framework: null,
    detectedVersion: null,
    httpStatus: null,
    errorSignature: null,
    message: '',
    durationMs: 0,
  }

  try {
    // Validate URL
    urlSchema.parse(url)

    // Step 1: Fingerprint the framework
    const fingerprint = await fingerprintFramework(url)
    result.framework = fingerprint.framework
    result.detectedVersion = fingerprint.version
    result.usesRsc = fingerprint.usesRsc

    if (!fingerprint.usesRsc) {
      result.message = 'Site does not appear to use React Server Components. Not vulnerable.'
      result.durationMs = Date.now() - startTime
      return result
    }

    // Step 2: Safe vulnerability check
    const vulnCheck = await safeVulnerabilityCheck(url)
    result.httpStatus = vulnCheck.status
    result.errorSignature = vulnCheck.signature

    if (vulnCheck.isVulnerable) {
      result.vulnerable = true
      result.confidence = vulnCheck.confidence
      result.message = `VULNERABLE: Site is affected by React2Shell (CVE-2025-55182). ${
        result.framework ? `Detected framework: ${result.framework}` : ''
      } ${result.detectedVersion ? `v${result.detectedVersion}` : ''}`.trim()
    } else {
      result.message = 'Site uses RSC but appears to be patched or protected.'
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      result.message = `Invalid URL: ${error.errors[0]?.message}`
    } else if (error instanceof Error) {
      result.message = `Scan error: ${error.message}`
    }
  }

  result.durationMs = Date.now() - startTime
  return result
}

// Framework fingerprinting
async function fingerprintFramework(url: string): Promise<{
  framework: string | null
  version: string | null
  usesRsc: boolean
}> {
  const result = { framework: null as string | null, version: null as string | null, usesRsc: false }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,text/x-component',
        'User-Agent': 'React2ShellScanner/1.0 (Security Research)',
      },
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeout)

    const headers = response.headers
    const html = await response.text()

    // Next.js detection
    if (
      headers.get('x-nextjs-cache') ||
      headers.get('x-powered-by')?.toLowerCase().includes('next') ||
      html.includes('__NEXT_DATA__') ||
      html.includes('/_next/static')
    ) {
      result.framework = 'nextjs'

      // Version detection from build manifest
      const versionMatch = html.match(/\/_next\/static\/([^/]+)\/_buildManifest\.js/)
      if (versionMatch) {
        // Build ID, not version, but indicates Next.js
        result.usesRsc = true // Assume RSC if modern Next.js
      }

      // Check for App Router indicators (RSC)
      if (
        html.includes('__next_f') ||
        html.includes('self.__next_f') ||
        headers.get('content-type')?.includes('text/x-component')
      ) {
        result.usesRsc = true
      }
    }

    // Remix detection
    if (html.includes('__remixContext') || html.includes('__remixManifest')) {
      result.framework = 'remix'
      // Remix RSC support is newer, check for indicators
      result.usesRsc = html.includes('__remix_rsc')
    }

    // Generic RSC detection
    if (!result.usesRsc && html.includes('text/x-component')) {
      result.usesRsc = true
    }

  } catch (error) {
    // Network error - can't determine
  }

  return result
}

// Safe vulnerability check (no code execution)
async function safeVulnerabilityCheck(url: string): Promise<{
  isVulnerable: boolean
  confidence: 'high' | 'medium' | 'low'
  status: number | null
  signature: string | null
}> {
  const result = {
    isVulnerable: false,
    confidence: 'low' as 'high' | 'medium' | 'low',
    status: null as number | null,
    signature: null as string | null,
  }

  try {
    // Malformed RSC payload that triggers error in vulnerable versions
    // This does NOT execute code - it causes a parsing error
    const malformedPayload = '1:I["$","invalid",null]\n0:{"invalid":true}'

    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2)
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="1_$ACTION_REF_1"',
      '',
      '',
      `--${boundary}`,
      'Content-Disposition: form-data; name="1_$ACTION_1:0"',
      '',
      JSON.stringify({ id: 'invalid', bound: null }),
      `--${boundary}`,
      'Content-Disposition: form-data; name="0"',
      '',
      malformedPayload,
      `--${boundary}--`,
    ].join('\r\n')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Next-Action': 'c67c4e1a40fcc26b5e3c0d5d17f16786f4244989',
        'Accept': 'text/x-component',
        'User-Agent': 'React2ShellScanner/1.0 (Security Research)',
      },
      body,
      signal: controller.signal,
      redirect: 'manual', // Don't follow redirects for this check
    })

    clearTimeout(timeout)

    result.status = response.status
    const responseText = await response.text()

    // Vulnerable signature: 500 status + specific error digest
    if (response.status === 500) {
      if (responseText.includes('E{"digest"') || responseText.includes('{"digest":')) {
        result.isVulnerable = true
        result.confidence = 'high'
        result.signature = 'HTTP 500 + RSC error digest'
      } else if (responseText.includes('Error') || responseText.includes('error')) {
        // 500 with generic error - might be vulnerable
        result.isVulnerable = true
        result.confidence = 'medium'
        result.signature = 'HTTP 500 + generic error'
      }
    }

    // Check for redirect with specific pattern (alternate detection)
    if (response.status === 303 || response.status === 302) {
      const location = response.headers.get('location')
      const actionRedirect = response.headers.get('x-action-redirect')
      if (actionRedirect?.includes('a=')) {
        // This would indicate the math operation executed
        result.isVulnerable = true
        result.confidence = 'high'
        result.signature = 'X-Action-Redirect with payload result'
      }
    }

  } catch (error) {
    // Timeout or network error
    if (error instanceof Error && error.name === 'AbortError') {
      result.signature = 'Request timeout'
    }
  }

  return result
}

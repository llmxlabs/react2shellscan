# React2Shell Scanner - Product Design Specification

> **Version:** 1.0  
> **Last Updated:** January 2, 2026  
> **Target:** MVP for local development with Windsurf

---

## 1. Product Overview

### 1.1 Problem Statement
"Vibecoders" (developers using AI-assisted coding tools like Cursor, Windsurf, Copilot) are shipping Next.js/React apps without understanding the security implications. React2Shell (CVE-2025-55182) is a CVSS 10.0 RCE vulnerability affecting default Next.js configurations. Existing scanners are CLI-only or broken.

### 1.2 Solution
A web-based scanner where users input a URL, get an instant vulnerability assessment, and receive a copy-paste prompt for their AI IDE to fix the issue.

### 1.3 Target Users
- Solo developers / indie hackers using Next.js
- Small teams without dedicated security
- Bug bounty hunters (with authorization)
- DevOps engineers checking production sites

### 1.4 Success Metrics
- Scans completed per day
- Conversion: scan → signup
- Prompt copy rate
- Return user rate

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Next.js 15 (Pages Router) | Familiar, fast; avoid App Router irony |
| Styling | Tailwind CSS + shadcn/ui | Rapid UI development |
| Backend | Next.js API Routes | Monorepo simplicity for MVP |
| Database | SQLite (local) → PostgreSQL (prod) | Zero config locally, Drizzle ORM |
| Queue | None for MVP (sync scanning) | Add BullMQ later if needed |
| Auth | NextAuth.js v5 | Simple, extensible |
| Rate Limiting | Upstash Redis or in-memory | Prevent abuse |
| Analytics | Plausible or PostHog | Privacy-friendly |

### 2.1 Project Structure

```
react2shell-scanner/
├── src/
│   ├── app/                    # Next.js App Router (minimal)
│   │   └── api/               # API routes only
│   │       ├── scan/
│   │       │   └── route.ts   # POST /api/scan
│   │       ├── scans/
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       └── prompt/
│   │           └── route.ts   # GET /api/prompt?scanId=xxx
│   ├── pages/                 # Pages Router for main UI
│   │   ├── index.tsx          # Landing + scan form
│   │   ├── results/
│   │   │   └── [id].tsx       # Scan results page
│   │   ├── history.tsx        # User's scan history
│   │   └── auth/
│   │       └── signin.tsx
│   ├── components/
│   │   ├── ui/                # shadcn components
│   │   ├── ScanForm.tsx
│   │   ├── ScanResult.tsx
│   │   ├── PromptCard.tsx
│   │   ├── VulnerabilityBadge.tsx
│   │   └── Layout.tsx
│   ├── lib/
│   │   ├── scanner/
│   │   │   ├── detect.ts      # Core detection logic
│   │   │   ├── fingerprint.ts # Framework detection
│   │   │   └── types.ts
│   │   ├── prompts/
│   │   │   └── templates.ts   # IDE prompt templates
│   │   ├── db/
│   │   │   ├── schema.ts      # Drizzle schema
│   │   │   ├── index.ts       # DB client
│   │   │   └── migrations/
│   │   ├── auth.ts            # NextAuth config
│   │   └── rate-limit.ts
│   └── styles/
│       └── globals.css
├── drizzle.config.ts
├── next.config.js
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── .env.local.example
```

---

## 3. Database Schema

### 3.1 Drizzle Schema (src/lib/db/schema.ts)

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').unique().notNull(),
  name: text('name'),
  plan: text('plan', { enum: ['free', 'pro', 'enterprise'] }).default('free'),
  scansToday: integer('scans_today').default(0),
  scansResetAt: integer('scans_reset_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const scans = sqliteTable('scans', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').references(() => users.id),
  url: text('url').notNull(),
  normalizedUrl: text('normalized_url').notNull(), // For deduplication
  status: text('status', { 
    enum: ['pending', 'running', 'complete', 'error'] 
  }).default('pending'),
  
  // Results
  vulnerable: integer('vulnerable', { mode: 'boolean' }),
  confidence: text('confidence', { enum: ['high', 'medium', 'low'] }),
  usesRsc: integer('uses_rsc', { mode: 'boolean' }),
  framework: text('framework'), // 'nextjs', 'remix', 'waku', etc.
  detectedVersion: text('detected_version'),
  
  // Detection details
  httpStatus: integer('http_status'),
  errorSignature: text('error_signature'),
  rawResponse: text('raw_response'), // First 1000 chars for debugging
  
  // Meta
  authorizationConfirmed: integer('authorization_confirmed', { mode: 'boolean' }).default(false),
  scanDurationMs: integer('scan_duration_ms'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

// For caching recent scans of the same URL
export const scanCache = sqliteTable('scan_cache', {
  normalizedUrl: text('normalized_url').primaryKey(),
  lastScanId: text('last_scan_id').references(() => scans.id),
  vulnerable: integer('vulnerable', { mode: 'boolean' }),
  confidence: text('confidence'),
  cachedAt: integer('cached_at', { mode: 'timestamp' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
});
```

---

## 4. API Specification

### 4.1 POST /api/scan

**Request:**
```typescript
interface ScanRequest {
  url: string;
  authorizationConfirmed: boolean;
}
```

**Response:**
```typescript
interface ScanResponse {
  id: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  url: string;
  result?: {
    vulnerable: boolean;
    confidence: 'high' | 'medium' | 'low';
    usesRsc: boolean;
    framework: string | null;
    detectedVersion: string | null;
    message: string;
  };
  error?: string;
  cached?: boolean;
  createdAt: string;
}
```

**Validation Rules:**
- URL must be valid HTTP/HTTPS
- URL must not be localhost/private IP
- authorizationConfirmed must be true
- Rate limit: 5/day anonymous, 10/day free, 100/day pro

**Example:**
```bash
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "authorizationConfirmed": true}'
```

### 4.2 GET /api/scans/[id]

**Response:** Same as ScanResponse above

### 4.3 GET /api/prompt?scanId=xxx

**Response:**
```typescript
interface PromptResponse {
  scanId: string;
  prompt: string;        // The IDE-ready prompt
  shortPrompt: string;   // Condensed version
  manualSteps: string[]; // Step-by-step without AI
}
```

---

## 5. Core Detection Logic

### 5.1 Detection Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      URL Input                                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: URL Validation & Normalization                         │
│  - Parse URL, validate scheme (http/https)                      │
│  - Block private IPs, localhost                                 │
│  - Normalize: lowercase host, remove trailing slash             │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 2: Cache Check                                            │
│  - Check scanCache for recent scan of normalized URL            │
│  - If cached < 1 hour and high confidence, return cached result │
└─────────────────────┬───────────────────────────────────────────┘
                      │ (cache miss)
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 3: Framework Fingerprinting                               │
│  - GET request with Accept: text/x-component                    │
│  - Check response headers: x-nextjs-cache, x-powered-by         │
│  - Check HTML for __next, __remixContext, etc.                  │
│  - Extract version from /_next/static chunks if possible        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
              ┌───────┴───────┐
              │  Uses RSC?    │
              └───────┬───────┘
                      │
         ┌────────────┼────────────┐
         │ No                      │ Yes
         ▼                         ▼
┌─────────────────┐   ┌─────────────────────────────────────────┐
│ Return: NOT     │   │  Step 4: Safe Vulnerability Check       │
│ VULNERABLE      │   │  - Send malformed RSC payload           │
│ (no RSC = safe) │   │  - Check for 500 + E{"digest" signature │
└─────────────────┘   └─────────────────────┬───────────────────┘
                                            │
                                            ▼
                      ┌─────────────────────────────────────────┐
                      │  Step 5: Determine Result               │
                      │  - 500 + digest = VULNERABLE (high)     │
                      │  - 500 no digest = LIKELY VULN (medium) │
                      │  - Other = NOT VULNERABLE               │
                      └─────────────────────────────────────────┘
```

### 5.2 Detection Implementation (src/lib/scanner/detect.ts)

```typescript
import { z } from 'zod';

// Types
export interface ScanResult {
  vulnerable: boolean;
  confidence: 'high' | 'medium' | 'low';
  usesRsc: boolean;
  framework: string | null;
  detectedVersion: string | null;
  httpStatus: number | null;
  errorSignature: string | null;
  message: string;
  durationMs: number;
}

// URL validation
const urlSchema = z.string().url().refine((url) => {
  const parsed = new URL(url);
  // Block private IPs
  const privatePatterns = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^0\./,
    /^169\.254\./,
  ];
  return !privatePatterns.some(p => p.test(parsed.hostname));
}, 'Private/local URLs are not allowed');

// Normalize URL for caching
export function normalizeUrl(url: string): string {
  const parsed = new URL(url);
  return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${parsed.pathname.replace(/\/$/, '') || '/'}`;
}

// Main detection function
export async function detectReact2Shell(url: string): Promise<ScanResult> {
  const startTime = Date.now();
  
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
  };

  try {
    // Validate URL
    urlSchema.parse(url);
    
    // Step 1: Fingerprint the framework
    const fingerprint = await fingerprintFramework(url);
    result.framework = fingerprint.framework;
    result.detectedVersion = fingerprint.version;
    result.usesRsc = fingerprint.usesRsc;
    
    if (!fingerprint.usesRsc) {
      result.message = 'Site does not appear to use React Server Components. Not vulnerable.';
      result.durationMs = Date.now() - startTime;
      return result;
    }
    
    // Step 2: Safe vulnerability check
    const vulnCheck = await safeVulnerabilityCheck(url);
    result.httpStatus = vulnCheck.status;
    result.errorSignature = vulnCheck.signature;
    
    if (vulnCheck.isVulnerable) {
      result.vulnerable = true;
      result.confidence = vulnCheck.confidence;
      result.message = `VULNERABLE: Site is affected by React2Shell (CVE-2025-55182). ${
        result.framework ? `Detected framework: ${result.framework}` : ''
      } ${result.detectedVersion ? `v${result.detectedVersion}` : ''}`.trim();
    } else {
      result.message = 'Site uses RSC but appears to be patched or protected.';
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      result.message = `Invalid URL: ${error.errors[0]?.message}`;
    } else if (error instanceof Error) {
      result.message = `Scan error: ${error.message}`;
    }
  }
  
  result.durationMs = Date.now() - startTime;
  return result;
}

// Framework fingerprinting
async function fingerprintFramework(url: string): Promise<{
  framework: string | null;
  version: string | null;
  usesRsc: boolean;
}> {
  const result = { framework: null as string | null, version: null as string | null, usesRsc: false };
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,text/x-component',
        'User-Agent': 'React2ShellScanner/1.0 (Security Research)',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    
    clearTimeout(timeout);
    
    const headers = response.headers;
    const html = await response.text();
    
    // Next.js detection
    if (
      headers.get('x-nextjs-cache') ||
      headers.get('x-powered-by')?.toLowerCase().includes('next') ||
      html.includes('__NEXT_DATA__') ||
      html.includes('/_next/static')
    ) {
      result.framework = 'nextjs';
      
      // Version detection from build manifest
      const versionMatch = html.match(/\/_next\/static\/([^/]+)\/_buildManifest\.js/);
      if (versionMatch) {
        // Build ID, not version, but indicates Next.js
        result.usesRsc = true; // Assume RSC if modern Next.js
      }
      
      // Check for App Router indicators (RSC)
      if (
        html.includes('__next_f') || 
        html.includes('self.__next_f') ||
        headers.get('content-type')?.includes('text/x-component')
      ) {
        result.usesRsc = true;
      }
    }
    
    // Remix detection
    if (html.includes('__remixContext') || html.includes('__remixManifest')) {
      result.framework = 'remix';
      // Remix RSC support is newer, check for indicators
      result.usesRsc = html.includes('__remix_rsc');
    }
    
    // Generic RSC detection
    if (!result.usesRsc && html.includes('text/x-component')) {
      result.usesRsc = true;
    }
    
  } catch (error) {
    // Network error - can't determine
  }
  
  return result;
}

// Safe vulnerability check (no code execution)
async function safeVulnerabilityCheck(url: string): Promise<{
  isVulnerable: boolean;
  confidence: 'high' | 'medium' | 'low';
  status: number | null;
  signature: string | null;
}> {
  const result = {
    isVulnerable: false,
    confidence: 'low' as const,
    status: null as number | null,
    signature: null as string | null,
  };
  
  try {
    // Malformed RSC payload that triggers error in vulnerable versions
    // This does NOT execute code - it causes a parsing error
    const malformedPayload = '1:I["$","invalid",null]\n0:{"invalid":true}';
    
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2);
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
    ].join('\r\n');
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    
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
    });
    
    clearTimeout(timeout);
    
    result.status = response.status;
    const responseText = await response.text();
    
    // Vulnerable signature: 500 status + specific error digest
    if (response.status === 500) {
      if (responseText.includes('E{"digest"') || responseText.includes('{"digest":')) {
        result.isVulnerable = true;
        result.confidence = 'high';
        result.signature = 'HTTP 500 + RSC error digest';
      } else if (responseText.includes('Error') || responseText.includes('error')) {
        // 500 with generic error - might be vulnerable
        result.isVulnerable = true;
        result.confidence = 'medium';
        result.signature = 'HTTP 500 + generic error';
      }
    }
    
    // Check for redirect with specific pattern (alternate detection)
    if (response.status === 303 || response.status === 302) {
      const location = response.headers.get('location');
      const actionRedirect = response.headers.get('x-action-redirect');
      if (actionRedirect?.includes('a=')) {
        // This would indicate the math operation executed
        result.isVulnerable = true;
        result.confidence = 'high';
        result.signature = 'X-Action-Redirect with payload result';
      }
    }
    
  } catch (error) {
    // Timeout or network error
    if (error instanceof Error && error.name === 'AbortError') {
      result.signature = 'Request timeout';
    }
  }
  
  return result;
}
```

---

## 6. Prompt Templates

### 6.1 Template System (src/lib/prompts/templates.ts)

```typescript
import type { ScanResult } from '../scanner/detect';

interface PromptContext {
  url: string;
  result: ScanResult;
}

export function generatePrompt(ctx: PromptContext): {
  prompt: string;
  shortPrompt: string;
  manualSteps: string[];
} {
  const { url, result } = ctx;
  
  // Framework-specific versions
  const fixVersions = getFixVersions(result.framework, result.detectedVersion);
  
  const prompt = `## Fix React2Shell Vulnerability (CVE-2025-55182)

**Scan Result:** ${url} is VULNERABLE to React2Shell
**Severity:** CRITICAL (CVSS 10.0) - Unauthenticated Remote Code Execution
**Framework:** ${result.framework || 'Unknown'} ${result.detectedVersion ? `v${result.detectedVersion}` : ''}

### Required Updates

Update your package.json dependencies to these minimum versions:

\`\`\`json
{
  "dependencies": {
${fixVersions.map(v => `    "${v.package}": "^${v.minVersion}"`).join(',\n')}
  }
}
\`\`\`

### Instructions

1. Update package.json with the versions above
2. Run \`npm install\` (or yarn/pnpm equivalent)
3. Run \`npm run build\` to verify the app builds successfully
4. Test critical functionality before deploying
5. Deploy the updated application immediately

### If You Encounter Breaking Changes

${result.framework === 'nextjs' ? `
- Check Next.js release notes: https://github.com/vercel/next.js/releases
- The patch versions should be backwards compatible
- If using custom server, ensure middleware is updated
` : `
- Check the framework's changelog for breaking changes
- The patch should be backwards compatible in most cases
`}

### Verification

After updating, you can verify the fix by:
1. Re-scanning this URL at react2shellscan.com
2. Checking your package-lock.json for updated versions
3. Looking for the security advisory acknowledgment in your dependency tree

---
*Generated by React2Shell Scanner on ${new Date().toISOString().split('T')[0]}*
`;

  const shortPrompt = `Fix CVE-2025-55182 (React2Shell) in my ${result.framework || 'React'} app. Update: ${
    fixVersions.map(v => `${v.package}@${v.minVersion}+`).join(', ')
  }. Then npm install && npm run build.`;

  const manualSteps = [
    `Open package.json in your project root`,
    ...fixVersions.map(v => `Update "${v.package}" to "^${v.minVersion}" or higher`),
    `Run: npm install`,
    `Run: npm run build`,
    `Test your application locally`,
    `Deploy to production immediately`,
    `Re-scan at react2shellscan.com to verify the fix`,
  ];

  return { prompt, shortPrompt, manualSteps };
}

function getFixVersions(framework: string | null, detectedVersion: string | null): Array<{
  package: string;
  minVersion: string;
}> {
  // Based on official advisories as of Jan 2026
  const versions = [
    { package: 'react', minVersion: '19.1.2' },
    { package: 'react-dom', minVersion: '19.1.2' },
  ];
  
  if (framework === 'nextjs') {
    // Next.js specific versions
    versions.push(
      { package: 'next', minVersion: '15.2.6' },
    );
  }
  
  // RSC packages that may be direct dependencies
  versions.push(
    { package: 'react-server-dom-webpack', minVersion: '19.1.2' },
  );
  
  return versions;
}

export function generateRawPromptForIDE(ctx: PromptContext): string {
  const { result } = ctx;
  const fixVersions = getFixVersions(result.framework, result.detectedVersion);
  
  return `My ${result.framework || 'React'} application is vulnerable to CVE-2025-55182 (React2Shell), a critical RCE vulnerability. 

Please update my package.json to fix this:
${fixVersions.map(v => `- ${v.package} to version ${v.minVersion} or higher`).join('\n')}

After updating package.json:
1. Run npm install
2. Run npm run build to verify everything compiles
3. Check for any breaking changes and fix if needed

This is a critical security fix - the vulnerability allows unauthenticated remote code execution.`;
}
```

---

## 7. UI Components

### 7.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [Logo] React2Shell Scanner              [Scan History] [Sign In]       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                    Check if your site is vulnerable to                  │
│                    React2Shell (CVE-2025-55182)                         │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  https://                                                    🔍 │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   ☑ I confirm I have authorization to scan this URL                     │
│                                                                         │
│                         [ Scan Now ]                                    │
│                                                                         │
│   ─────────────────────────────────────────────────────────────────     │
│                                                                         │
│   What is React2Shell?                                                  │
│   CVE-2025-55182 is a critical (CVSS 10.0) remote code execution       │
│   vulnerability in React Server Components. Default Next.js apps        │
│   created with create-next-app are vulnerable.                          │
│                                                                         │
│   • Affects: React 19.x, Next.js 15.x/16.x with App Router             │
│   • Impact: Unauthenticated RCE via single HTTP request                 │
│   • Fix: Update to react@19.1.2+, next@15.2.6+                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Results Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [Logo] React2Shell Scanner              [Scan History] [Sign In]       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  🔴 VULNERABLE                                          HIGH      │  │
│  │                                                       CONFIDENCE   │  │
│  │  https://example.com                                              │  │
│  │                                                                   │  │
│  │  Framework: Next.js                                               │  │
│  │  Uses RSC: Yes                                                    │  │
│  │  Scan Duration: 1.2s                                              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  🛠️ Fix with AI IDE                                    [Copy] 📋  │  │
│  │  ─────────────────────────────────────────────────────────────    │  │
│  │  My Next.js application is vulnerable to CVE-2025-55182...        │  │
│  │  Please update my package.json to fix this:                       │  │
│  │  - next to version 15.2.6 or higher                               │  │
│  │  - react to version 19.1.2 or higher                              │  │
│  │  ...                                                              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  📋 Manual Steps                                                  │  │
│  │  ─────────────────────────────────────────────────────────────    │  │
│  │  1. Open package.json in your project root                        │  │
│  │  2. Update "next" to "^15.2.6" or higher                          │  │
│  │  3. Update "react" to "^19.1.2" or higher                         │  │
│  │  4. Run: npm install                                              │  │
│  │  5. Run: npm run build                                            │  │
│  │  6. Deploy to production immediately                              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│             [ Scan Another URL ]    [ Download Report ]                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Component Specifications

#### ScanForm.tsx
```typescript
interface ScanFormProps {
  onSubmit: (url: string) => Promise<void>;
  isLoading: boolean;
}

// States:
// - Default: Empty input, checkbox unchecked, button disabled
// - Valid: URL entered, checkbox checked, button enabled
// - Loading: Input disabled, spinner on button
// - Error: Red border on input, error message below

// Validation:
// - URL must start with http:// or https://
// - Checkbox must be checked
// - Debounce URL validation (300ms)
```

#### VulnerabilityBadge.tsx
```typescript
interface VulnerabilityBadgeProps {
  vulnerable: boolean;
  confidence: 'high' | 'medium' | 'low';
}

// Variants:
// - Vulnerable + High: Red background, "VULNERABLE" text
// - Vulnerable + Medium: Orange background, "LIKELY VULNERABLE"
// - Vulnerable + Low: Yellow background, "POSSIBLY VULNERABLE"
// - Not Vulnerable: Green background, "NOT VULNERABLE"
// - Unknown: Gray background, "UNKNOWN"
```

#### PromptCard.tsx
```typescript
interface PromptCardProps {
  prompt: string;
  shortPrompt: string;
  onCopy: () => void;
  copied: boolean;
}

// Features:
// - Tabbed view: "Full Prompt" | "Short Version"
// - Copy button with success feedback
// - Syntax highlighting for code blocks
// - Collapsible sections
```

---

## 8. API Route Implementations

### 8.1 POST /api/scan (src/app/api/scan/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { detectReact2Shell, normalizeUrl } from '@/lib/scanner/detect';
import { db } from '@/lib/db';
import { scans, scanCache } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { rateLimit } from '@/lib/rate-limit';

const scanRequestSchema = z.object({
  url: z.string().url(),
  authorizationConfirmed: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm authorization to scan' }),
  }),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(ip);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
      );
    }
    
    // Parse and validate request
    const body = await request.json();
    const { url, authorizationConfirmed } = scanRequestSchema.parse(body);
    
    const normalized = normalizeUrl(url);
    
    // Check cache (1 hour TTL)
    const cached = await db.query.scanCache.findFirst({
      where: and(
        eq(scanCache.normalizedUrl, normalized),
        gt(scanCache.expiresAt, new Date())
      ),
    });
    
    if (cached && cached.lastScanId) {
      const cachedScan = await db.query.scans.findFirst({
        where: eq(scans.id, cached.lastScanId),
      });
      
      if (cachedScan) {
        return NextResponse.json({
          id: cachedScan.id,
          status: 'complete',
          url: cachedScan.url,
          cached: true,
          result: {
            vulnerable: cachedScan.vulnerable,
            confidence: cachedScan.confidence,
            usesRsc: cachedScan.usesRsc,
            framework: cachedScan.framework,
            detectedVersion: cachedScan.detectedVersion,
            message: cachedScan.vulnerable 
              ? 'Site is vulnerable to React2Shell (cached result)'
              : 'Site does not appear vulnerable (cached result)',
          },
          createdAt: cachedScan.createdAt?.toISOString(),
        });
      }
    }
    
    // Create scan record
    const [scan] = await db.insert(scans).values({
      url,
      normalizedUrl: normalized,
      status: 'running',
      authorizationConfirmed,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
    }).returning();
    
    // Run detection
    const result = await detectReact2Shell(url);
    
    // Update scan with results
    await db.update(scans)
      .set({
        status: 'complete',
        vulnerable: result.vulnerable,
        confidence: result.confidence,
        usesRsc: result.usesRsc,
        framework: result.framework,
        detectedVersion: result.detectedVersion,
        httpStatus: result.httpStatus,
        errorSignature: result.errorSignature,
        scanDurationMs: result.durationMs,
        completedAt: new Date(),
      })
      .where(eq(scans.id, scan.id));
    
    // Update cache
    await db.insert(scanCache)
      .values({
        normalizedUrl: normalized,
        lastScanId: scan.id,
        vulnerable: result.vulnerable,
        confidence: result.confidence,
        cachedAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      })
      .onConflictDoUpdate({
        target: scanCache.normalizedUrl,
        set: {
          lastScanId: scan.id,
          vulnerable: result.vulnerable,
          confidence: result.confidence,
          cachedAt: new Date(),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
    
    return NextResponse.json({
      id: scan.id,
      status: 'complete',
      url,
      cached: false,
      result: {
        vulnerable: result.vulnerable,
        confidence: result.confidence,
        usesRsc: result.usesRsc,
        framework: result.framework,
        detectedVersion: result.detectedVersion,
        message: result.message,
      },
      createdAt: scan.createdAt?.toISOString(),
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Scan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 9. Environment Variables

### .env.local.example

```bash
# Database
DATABASE_URL="file:./dev.db"

# Auth (NextAuth)
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Optional: OAuth providers
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Rate limiting (optional - uses in-memory if not set)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Analytics (optional)
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=""

# Feature flags
ENABLE_AUTH="false"  # Set to true to require login
SCANS_PER_DAY_ANONYMOUS="5"
SCANS_PER_DAY_FREE="10"
SCANS_PER_DAY_PRO="100"
```

---

## 10. MVP Checklist

### Week 1: Core Infrastructure
- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Tailwind + shadcn/ui
- [ ] Configure Drizzle + SQLite
- [ ] Implement URL validation logic
- [ ] Build basic scanner (fingerprint + detection)
- [ ] Create POST /api/scan endpoint

### Week 2: UI + UX
- [ ] Build landing page with scan form
- [ ] Create results page with vulnerability display
- [ ] Implement prompt generation
- [ ] Add copy-to-clipboard functionality
- [ ] Style with proper loading/error states
- [ ] Add basic SEO (meta tags, OG images)

### Week 3: Polish + Launch Prep
- [ ] Add rate limiting
- [ ] Implement scan caching
- [ ] Create scan history page (no auth)
- [ ] Add basic analytics
- [ ] Write ToS and Privacy Policy
- [ ] Test against known vulnerable/patched sites
- [ ] Deploy to Vercel

### Post-MVP
- [ ] Add authentication (NextAuth)
- [ ] Implement user scan history
- [ ] Add email alerts for monitored sites
- [ ] Build API access for CI/CD
- [ ] Create detailed PDF reports

---

## 11. Testing Strategy

### Manual Test Cases

| Test Case | URL Type | Expected Result |
|-----------|----------|-----------------|
| Blank Next.js 16 app | Vulnerable | HIGH confidence |
| Patched Next.js 15.2.6+ | Not vulnerable | - |
| React 18 app (no RSC) | Not vulnerable | usesRsc: false |
| Non-React site | Not vulnerable | framework: null |
| Site behind Cloudflare WAF | May show patched | Check for WAF bypass |
| Invalid URL | Error | Validation error |
| Private IP | Error | Blocked |

### Test URLs (Use your own test deployments)
```bash
# Create a vulnerable test app
npx create-next-app@16.0.6 vuln-test --yes
cd vuln-test && npm run build && npm run start

# Create a patched test app  
npx create-next-app@latest patched-test --yes
cd patched-test && npm run build && npm run start
```

---

## 12. Security Considerations

### What This Scanner Does NOT Do
- ❌ Execute arbitrary code on target servers
- ❌ Exploit the vulnerability
- ❌ Store sensitive response data
- ❌ Scan without user confirmation

### What This Scanner DOES Do
- ✅ Send benign malformed payloads
- ✅ Analyze error responses for vulnerability signatures
- ✅ Log all scans with IP + timestamp for abuse tracking
- ✅ Rate limit to prevent abuse
- ✅ Require authorization confirmation

### Legal Protection
- Clear ToS requiring authorization
- Audit log of all scans
- Abuse reporting mechanism
- DMCA/takedown contact info

---

*End of Design Specification*
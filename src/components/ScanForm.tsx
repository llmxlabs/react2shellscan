import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Globe, Search, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface ScanFormProps {
  onSubmit?: (url: string) => Promise<void>
  isLoading?: boolean
}

export function ScanForm({ onSubmit, isLoading = false }: ScanFormProps) {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [authorized, setAuthorized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (router.isReady && router.query.url) {
      setUrl(router.query.url as string)
    }
  }, [router.isReady, router.query.url])

  const validation = url ? validateUrl(url) : { valid: false }
  const canSubmit = validation.valid && authorized && !submitting && !isLoading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const validationResult = validateUrl(url)
    if (!validationResult.valid) {
      setError(validationResult.error || 'Invalid URL')
      return
    }

    if (!authorized) {
      setError('Please confirm you have authorization to scan this URL')
      return
    }

    setSubmitting(true)

    try {
      if (onSubmit) {
        await onSubmit(url)
      } else {
        // Default behavior: call API
        const response = await fetch('/api/scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            authorizationConfirmed: true,
            website: (e.target as any).website?.value || "",
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Scan failed')
        }

        const result = await response.json()
        router.push(`/results/${result.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-6">
      <div className="relative">
        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="url"
          placeholder="https://your-site.com"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            setError(null)
          }}
          className="h-14 pl-12 pr-4 text-lg font-mono bg-card border-border/50 focus:border-primary/50"
          disabled={submitting || isLoading}
        />
      </div>

      {/* Honeypot field - hidden from users but visible to bots */}
      <div className="sr-only" aria-hidden="true">
        <Input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          placeholder="Do not fill this out"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm animate-fade-in">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {url && !validation.valid && validation.error && !error && (
        <div className="flex items-center gap-2 text-destructive text-sm animate-fade-in">
          <AlertCircle className="h-4 w-4" />
          {validation.error}
        </div>
      )}

      <div className="flex items-start gap-3">
        <Checkbox
          id="authorization"
          checked={authorized}
          onCheckedChange={(checked) => setAuthorized(checked === true)}
          className="mt-0.5"
          disabled={submitting || isLoading}
        />
        <Label
          htmlFor="authorization"
          className="text-sm text-muted-foreground cursor-pointer leading-relaxed"
        >
          I confirm I have authorization to scan this URL
        </Label>
      </div>

      <Button
        type="submit"
        disabled={!canSubmit}
        className="w-full h-12 text-base font-medium gap-2"
      >
        <Search className="h-5 w-5" />
        {submitting || isLoading ? 'Scanning...' : 'Scan Now'}
      </Button>

      <p className="text-xs text-center text-muted-foreground/60 px-4">
        Passive check: This assessment only analyzes public response signatures and headers. No code is executed on your server.
      </p>
    </form>
  )
}

function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url)

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Please enter a valid URL starting with http:// or https://' }
    }

    const hostname = parsed.hostname.toLowerCase()

    // Block localhost and private IPs
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
      return { valid: false, error: 'Scanning private/local URLs is not allowed' }
    }

    return { valid: true }
  } catch {
    return { valid: false, error: 'Please enter a valid URL starting with http:// or https://' }
  }
}

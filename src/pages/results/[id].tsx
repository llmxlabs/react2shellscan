import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { VulnerabilityBadge } from '@/components/VulnerabilityBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CopyButton } from '@/components/CopyButton'
import { ArrowLeft, Clock, Server, Cpu } from 'lucide-react'
import { generatePrompt } from '@/lib/prompts/templates'

interface ScanResult {
  id: string
  status: 'pending' | 'running' | 'complete' | 'error'
  url: string
  result?: {
    vulnerable: boolean
    confidence: 'high' | 'medium' | 'low'
    usesRsc: boolean
    framework: string | null
    detectedVersion: string | null
    message: string
  }
  error?: string
  createdAt: string
}

export default function ResultsPage() {
  const router = useRouter()
  const { id: scanId } = router.query

  const [scan, setScan] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [prompt, setPrompt] = useState<any>(null)

  useEffect(() => {
    if (!scanId) return

    const fetchResult = async () => {
      try {
        const response = await fetch(`/api/scans/${scanId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch scan result')
        }
        const data = await response.json()
        setScan(data)

        if (data.status === 'complete' && data.result?.vulnerable) {
          // Generate prompt for vulnerable sites
          const promptData = await generatePrompt({
            url: data.url,
            result: {
              vulnerable: data.result.vulnerable,
              confidence: data.result.confidence,
              usesRsc: data.result.usesRsc,
              framework: data.result.framework,
              detectedVersion: data.result.detectedVersion,
              httpStatus: null,
              errorSignature: null,
              message: data.result.message,
              durationMs: 0,
            }
          })
          setPrompt(promptData)
        }

        if (data.status === 'complete' || data.status === 'error') {
          setLoading(false)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load results')
        setLoading(false)
      }
    }

    fetchResult()

    // Poll every 2 seconds if still running
    const interval = setInterval(() => {
      if (scan?.status === 'running' || scan?.status === 'pending') {
        fetchResult()
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [scanId, scan?.status])

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-destructive">Error</h1>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => router.push('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Scanner
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (loading || !scan) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="text-center space-y-4">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground">Analyzing your site...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const isVulnerable = scan.result?.vulnerable

  const getDaysVulnerable = () => {
    const disclosureDate = new Date('2025-12-03')
    const today = new Date()
    const diffTime = today.getTime() - disclosureDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Scanner
          </Button>

          <Card className={isVulnerable ? 'border-destructive/50' : 'border-green-500/50'}>
            <CardHeader className="text-center space-y-4">
              <VulnerabilityBadge
                vulnerable={scan.result?.vulnerable || false}
                confidence={scan.result?.confidence || null}
                size="lg"
              />
              <div className="space-y-2">
                <h1 className="text-xl font-mono break-all">{scan.url}</h1>
                {isVulnerable && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-mono">
                      Official CVE Disclosed Date: December 3, 2025
                    </p>
                    <p className="text-destructive font-bold animate-pulse text-lg">
                      Days Vulnerable: {getDaysVulnerable().toLocaleString()}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  {scan.result?.framework && (
                    <div className="flex items-center gap-1">
                      <Server className="h-4 w-4" />
                      {scan.result.framework} {scan.result.detectedVersion && `v${scan.result.detectedVersion}`}
                    </div>
                  )}
                  {scan.result && (
                    <div className="flex items-center gap-1">
                      <Cpu className="h-4 w-4" />
                      {scan.result.usesRsc ? 'Uses RSC' : 'No RSC'}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {new Date(scan.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </CardHeader>
            {scan.result && (
              <CardContent>
                <p className="text-center text-muted-foreground">
                  {scan.result.message}
                </p>
              </CardContent>
            )}
          </Card>

          {prompt && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🤖 Fix with AI IDE
                  <CopyButton text={prompt.prompt} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="full" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="full">Full Prompt</TabsTrigger>
                    <TabsTrigger value="short">Short Version</TabsTrigger>
                  </TabsList>
                  <TabsContent value="full" className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm font-mono">
                        {prompt.prompt}
                      </pre>
                    </div>
                  </TabsContent>
                  <TabsContent value="short" className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm font-mono">{prompt.shortPrompt}</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {prompt && (
            <Card>
              <CardHeader>
                <CardTitle>📋 Manual Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 text-sm">
                  {prompt.manualSteps.map((step: string, index: number) => (
                    <li key={index} className="flex gap-2">
                      <span className="font-mono text-muted-foreground min-w-[1.5rem]">
                        {index + 1}.
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          <div className="text-center space-y-4">
            <Button onClick={() => router.push('/')}>
              Scan Another URL
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

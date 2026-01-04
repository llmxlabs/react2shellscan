import { VulnerabilityBadge } from './VulnerabilityBadge'
import { CopyButton } from './CopyButton'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Share2, Clock, Cpu, Server, Gauge } from 'lucide-react'
import type { ScanResult } from '@/lib/scanner'

interface ScanResultCardProps {
  scan: ScanResult;
}

const AI_PROMPT = `My Next.js application is vulnerable to CVE-2025-55182 (React2Shell), a critical RCE vulnerability.

Please update my package.json to fix this:
- next to version 15.2.6 or higher
- react to version 19.1.2 or higher  
- react-dom to version 19.1.2 or higher

After updating:
1. Run npm install
2. Run npm run build to verify everything compiles
3. Deploy immediately - this is a critical security fix`;

const PACKAGE_JSON = `{
  "dependencies": {
    "next": "^15.2.6",
    "react": "^19.1.2",
    "react-dom": "^19.1.2"
  }
}`;

export function ScanResultCard({ scan }: ScanResultCardProps) {
  const isVulnerable = scan.vulnerable === true;

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback handled silently
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-fade-in">
      <Card className={isVulnerable ? 'border-destructive/50' : 'border-success/50'}>
        <CardHeader className="text-center space-y-4 pb-4">
          <VulnerabilityBadge
            vulnerable={isVulnerable}
            confidence={scan.confidence || null}
            size="lg"
          />
          <p className="font-mono text-lg break-all">{scan.url}</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background rounded-lg p-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Server className="h-4 w-4" />
                Framework Detected
              </div>
              <p className="font-medium capitalize">{scan.framework || 'Unknown'}</p>
            </div>

            <div className="bg-background rounded-lg p-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Cpu className="h-4 w-4" />
                Uses Server Components
              </div>
              <p className="font-medium">{scan.usesRsc ? 'Yes' : 'No'}</p>
            </div>

            <div className="bg-background rounded-lg p-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Gauge className="h-4 w-4" />
                Confidence
              </div>
              <p className="font-medium capitalize">{scan.confidence || 'Unknown'}</p>
            </div>

            <div className="bg-background rounded-lg p-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="h-4 w-4" />
                Scan Duration
              </div>
              <p className="font-medium">
                {scan.scanDurationMs ? `${(scan.scanDurationMs / 1000).toFixed(1)}s` : 'N/A'}
              </p>
            </div>
          </div>

          {isVulnerable && (
            <div className="pt-4 border-t border-border">
              <h3 className="font-semibold mb-4">How to Fix</h3>

              <Tabs defaultValue="prompt" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="prompt">AI IDE Prompt</TabsTrigger>
                  <TabsTrigger value="manual">Manual Steps</TabsTrigger>
                  <TabsTrigger value="package">package.json</TabsTrigger>
                </TabsList>

                <TabsContent value="prompt" className="mt-4">
                  <div className="relative">
                    <div className="absolute top-2 right-2 z-10">
                      <CopyButton text={AI_PROMPT} variant="outline" />
                    </div>
                    <pre className="bg-background rounded-lg p-4 pr-24 text-sm font-mono whitespace-pre-wrap overflow-x-auto border border-border">
                      {AI_PROMPT}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="manual" className="mt-4">
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">1</span>
                      <span>Open <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono">package.json</code> in your project root</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">2</span>
                      <span>Update <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono">"next"</code> to <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono">"^15.2.6"</code> or higher</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">3</span>
                      <span>Update <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono">"react"</code> to <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono">"^19.1.2"</code> or higher</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">4</span>
                      <span>Update <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono">"react-dom"</code> to <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono">"^19.1.2"</code> or higher</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">5</span>
                      <span>Run: <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono">npm install</code></span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">6</span>
                      <span>Run: <code className="bg-background px-1.5 py-0.5 rounded text-xs font-mono">npm run build</code></span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">7</span>
                      <span>Test your application</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">8</span>
                      <span>Deploy to production immediately</span>
                    </li>
                  </ol>
                </TabsContent>

                <TabsContent value="package" className="mt-4">
                  <div className="relative">
                    <div className="absolute top-2 right-2 z-10">
                      <CopyButton text={PACKAGE_JSON} variant="outline" />
                    </div>
                    <pre className="bg-background rounded-lg p-4 pr-24 text-sm font-mono overflow-x-auto border border-border">
                      {PACKAGE_JSON}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {!isVulnerable && (
            <div className="text-center py-4">
              <p className="text-success font-medium">
                Good news! This site does not appear to be vulnerable to React2Shell.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-4">
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Scan Another URL
          </Button>
        </Link>
        <Button variant="secondary" className="gap-2" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
          Share Results
        </Button>
      </div>
    </div>
  );
}

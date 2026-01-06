import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ScanForm } from '@/components/ScanForm'
import { useState, useEffect } from 'react'
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern"
import { cn } from "@/lib/utils"

export default function Home() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.1}
        duration={3}
        repeatDelay={1}
        className={cn(
          "[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12",
        )}
      />
      <div className="relative z-10">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                React2Shell Scanner
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Check if your site is vulnerable to{' '}
                <span className="font-semibold text-destructive">React2Shell (CVE-2025-55182)</span>
              </p>
              <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground/80 font-mono">
                {mounted && (
                  <p>Today: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                )}
              </div>
            </div>

            <div className="bg-card rounded-lg border p-8 shadow-lg">
              <ScanForm />
            </div>

            <div className="space-y-6 text-left max-w-3xl mx-auto">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold">What is React2Shell?</h2>
                <p className="text-muted-foreground">
                  A security scanner for CVE-2025-55182, a critical RCE in React Server Components.
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg border border-primary/10">
                <p className="text-sm text-center">
                  <span className="font-semibold text-primary">Passive Check:</span> This scanner performs a non-intrusive assessment of your site's headers and response signatures. It <strong>does not execute</strong> the RCE vulnerability or harm your server.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
                    Vulnerability Overview
                  </h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      <strong className="text-foreground">CVE-2025-55182</strong> is a critical (CVSS 10.0) remote code execution vulnerability affecting React 19.x and Next.js 15.x/16.x.
                    </p>
                    <p>
                      Apps created with <code className="bg-muted px-1 py-0.5 rounded text-xs">create-next-app</code> are often vulnerable by default if not updated.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
                    How it Works
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                    <li><strong>Fingerprinting:</strong> Identifies Next.js and RSC usage via passive header analysis.</li>
                  <li>
                      <strong>Safe Probing:</strong> Sends a non-destructive <code className="bg-muted px-1 py-0.5 rounded text-xs">POST</code> request with a validated RSC probe:
                      <pre className="mt-2 p-2 bg-muted rounded text-[10px] font-mono overflow-x-auto leading-relaxed">
{`------WebKitFormBoundaryx8jO2oVc6SWP3Sad
Content-Disposition: form-data; name="1"

{}
------WebKitFormBoundaryx8jO2oVc6SWP3Sad
Content-Disposition: form-data; name="0"

["$1:a:a"]
------WebKitFormBoundaryx8jO2oVc6SWP3Sad--`}
                      </pre>
                    </li>
                    <li><strong>Analysis:</strong> Evaluates for <code className="bg-muted px-1 py-0.5 rounded text-xs">HTTP 500</code> and the <code className="bg-muted px-1 py-0.5 rounded text-xs">E{"{"}"digest"</code> signature to confirm vulnerability without execution.</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-border/40">
                <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs text-muted-foreground">
                  <p><strong className="text-foreground">Affects:</strong> React 19.x, Next.js 15.x/16.x (App Router)</p>
                  <p><strong className="text-foreground">Impact:</strong> Unauthenticated RCE via HTTP request</p>
                  <p><strong className="text-foreground">Fix:</strong> Update to react@19.1.2+, next@15.2.6+</p>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}

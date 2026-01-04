import { Shield, Sun, Moon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

export function Header() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.remove('light')
    } else {
      root.classList.add('light')
    }
  }, [isDark])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <Shield className="h-7 w-7 text-destructive" />
          <span className="text-lg font-semibold">React2Shell Scanner</span>
        </Link>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDark(!isDark)}
            className="h-9 w-9"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  )
}

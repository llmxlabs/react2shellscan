export function Footer() {
  return (
    <footer className="border-t border-border/40 py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            Built for developers who ship fast by LLMXLabs
          </p>

          <div className="flex items-center gap-6">
            <a
              href="/privacy"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { Check, Circle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScanProgress as ScanProgressType } from '@/lib/scanner';

interface ScanProgressProps {
  progress: ScanProgressType;
  url: string;
}

export function ScanProgress({ progress, url }: ScanProgressProps) {
  return (
    <div className="w-full max-w-lg mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-4">
        <div className="relative inline-flex">
          <div className="h-16 w-16 rounded-full border-4 border-border flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin-slow" />
        </div>

        <div>
          <h2 className="text-xl font-semibold">Scanning...</h2>
          <p className="text-muted-foreground font-mono text-sm mt-1 truncate max-w-md">
            {url}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 space-y-4">
        {progress.steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center gap-3 text-sm transition-all duration-300',
              step.status === 'complete' && 'text-success',
              step.status === 'active' && 'text-foreground',
              step.status === 'pending' && 'text-muted-foreground'
            )}
          >
            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
              {step.status === 'complete' ? (
                <Check className="h-5 w-5" />
              ) : step.status === 'active' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
            </div>
            <span className={cn(step.status === 'active' && 'font-medium')}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        This usually takes 5-15 seconds
      </p>
    </div>
  );
}

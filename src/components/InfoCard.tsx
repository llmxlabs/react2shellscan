import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface InfoCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  className?: string;
}

export function InfoCard({ title, description, icon: Icon, className }: InfoCardProps) {
  return (
    <div
      className={cn(
        'bg-card rounded-xl border border-border p-6 transition-all hover:border-border/80 hover:bg-card/80',
        className
      )}
    >
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

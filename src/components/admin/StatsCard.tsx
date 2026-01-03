import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
}

export const StatsCard = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'bg-primary/10 text-primary',
}: StatsCardProps) => {
  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2 text-card-foreground">{value}</p>
          {change && (
            <p
              className={cn(
                'text-sm mt-2 font-medium',
                changeType === 'positive' && 'text-success',
                changeType === 'negative' && 'text-destructive',
                changeType === 'neutral' && 'text-muted-foreground'
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-lg', iconColor)}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

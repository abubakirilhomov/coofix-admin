import { cn } from '@/lib/utils';

type StatusType = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'active' | 'inactive';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-info/10 text-info border-info/20',
  },
  shipped: {
    label: 'Shipped',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-success/10 text-success border-success/20',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  active: {
    label: 'Active',
    className: 'bg-success/10 text-success border-success/20',
  },
  inactive: {
    label: 'Inactive',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status.toLowerCase()] || {
    label: status,
    className: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
};

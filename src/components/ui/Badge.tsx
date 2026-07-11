import { cn } from '@/lib/utils/helpers';
import { STATUS_COLORS } from '@/lib/constants';

interface BadgeProps {
  status: string;
  className?: string;
}

export default function Badge({ status, className }: BadgeProps) {
  const colorClass = STATUS_COLORS[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', colorClass, className)}>
      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
    </span>
  );
}

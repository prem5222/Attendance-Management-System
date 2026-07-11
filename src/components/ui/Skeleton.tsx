import { cn } from '@/lib/utils/helpers';

interface SkeletonProps {
  variant?: 'text' | 'circle' | 'card' | 'table-row';
  className?: string;
  count?: number;
}

export default function Skeleton({ variant = 'text', className, count = 1 }: SkeletonProps) {
  const baseClass = 'animate-pulse bg-white/10 rounded';
  const items = Array.from({ length: count });

  if (variant === 'circle') return <div className={cn(baseClass, 'rounded-full w-10 h-10', className)} />;
  if (variant === 'card') return (
    <div className={cn('bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4', className)}>
      {items.map((_, i) => (<div key={i} className={cn(baseClass, 'h-4 w-full')} style={{ width: `${70 + Math.random() * 30}%` }} />))}
    </div>
  );
  if (variant === 'table-row') return (
    <div className="space-y-3">
      {items.map((_, i) => (<div key={i} className="flex gap-4 p-4"><div className={cn(baseClass, 'h-4 flex-1')} /><div className={cn(baseClass, 'h-4 w-24')} /><div className={cn(baseClass, 'h-4 w-20')} /></div>))}
    </div>
  );
  return <>{items.map((_, i) => (<div key={i} className={cn(baseClass, 'h-4 w-full mb-2', className)} />))}</>;
}

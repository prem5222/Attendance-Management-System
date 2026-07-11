'use client';

import Image from 'next/image';
import { getInitials } from '@/lib/utils/helpers';
import { cn } from '@/lib/utils/helpers';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-lg' };
const pixelMap = { sm: 32, md: 40, lg: 64 };

export default function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <div className={cn('relative rounded-full overflow-hidden border-2 border-white/20', sizeMap[size], className)}>
        <Image src={src} alt={name} width={pixelMap[size]} height={pixelMap[size]} className="object-cover w-full h-full" />
      </div>
    );
  }
  return (
    <div className={cn('rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-semibold text-white border-2 border-white/20', sizeMap[size], className)}>
      {getInitials(name)}
    </div>
  );
}

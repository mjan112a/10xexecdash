'use client';

import { useSidebar } from './sidebar-context';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

export function MobileBackdrop() {
  const { isCollapsed, setIsCollapsed } = useSidebar();

  return (
    <div 
      className={cn(
        'lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-all duration-300 ease-out',
        isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
      )}
      onClick={() => setIsCollapsed(true)}
    />
  );
}

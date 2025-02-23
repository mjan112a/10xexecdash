'use client';

import { Menu } from 'lucide-react';
import { useSidebar } from './sidebar-context';

export function MobileHeader() {
  const { isCollapsed, setIsCollapsed } = useSidebar();

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b px-4 flex items-center z-40">
      <button
        type="button"
        onClick={() => {
          console.log('Mobile header clicked, toggling sidebar');
          setIsCollapsed(false);
        }}
        className="p-2 -ml-0.5 hover:bg-gray-100 rounded-lg transition-colors duration-200 active:scale-95 active:bg-gray-200"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>
    </header>
  );
}

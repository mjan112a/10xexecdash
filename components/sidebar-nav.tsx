'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  ChartPieIcon,
  FileText,
  Home,
  LineChart,
  Menu,
  MessageSquare,
  ShoppingCart,
} from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useSidebar } from './sidebar-context';

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  hidden?: boolean; // Added to support temporarily hiding items
};

const navItems: { category: string; items: NavItem[] }[] = [
  {
    category: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/',
        icon: Home,
      },
    ],
  },
  {
    category: 'Raw Data',
    items: [
      {
        title: 'Sales Data',
        href: '/raw-data',
        icon: ShoppingCart,
      },
    ],
  },
  {
    category: 'Analytics',
    items: [
      {
        title: 'Metrics',
        href: '/metricsofinterest',
        icon: BarChart3,
      },
      {
        title: 'Trend Graphs',
        href: '/metricsgraph',
        icon: LineChart,
      },
      {
        title: 'Dynamic Charts',
        href: '/dynamic-metrics',
        icon: ChartPieIcon,
        hidden: true, // Temporarily hidden
      },
      {
        title: 'Hypothetical Scenarios',
        href: '/hypothetical-metrics',
        icon: LineChart,
        hidden: true, // Temporarily hidden
      },
    ],
  },
  {
    category: 'Reports',
    items: [
      {
        title: 'Monthly Report',
        href: '/monthly-report',
        icon: FileText,
      },
    ],
  },
  {
    category: 'Tools',
    items: [
      {
        title: 'AI Assistant',
        href: '/ai-assistant',
        icon: MessageSquare,
        hidden: true, // Temporarily hidden
      },
    ],
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed } = useSidebar();

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      isCollapsed ? '64px' : '256px'
    );
  }, [isCollapsed]);

  return (
    <div
      className={cn(
        'fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-transform duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        // Mobile: highest z-index to be above backdrop
        'z-50',
        // Desktop: always show, Mobile: translate based on state
        isCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0',
        // Shadow only on mobile when open
        !isCollapsed && 'shadow-xl lg:shadow-none',
        'pt-14 lg:pt-0' // Add padding for mobile header
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center border-b px-3 py-4 bg-black">
          {isCollapsed ? (
            <div className="flex justify-center w-full">
              <Image 
                src="/10X-Logo-Blue_White.png" 
                alt="10X Logo" 
                width={40} 
                height={40} 
                className="object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <Image 
                src="/10X-Logo-Blue_White.png" 
                alt="10X Logo" 
                width={100} 
                height={40} 
                className="object-contain"
              />
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium text-white hover:bg-primary-foreground/10 p-2 touch-manipulation"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-auto py-2">
          {navItems.map((section, i) => (
            <div key={i} className="px-3 py-2">
              {!isCollapsed && (
                <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-primary">
                  {section.category}
                </h2>
              )}
              <div className="space-y-1">
                {section.items.filter(item => !item.hidden).map((item, j) => (
                  <Link
                    key={j}
                    href={item.href}
                    className={cn(
                      'flex items-center rounded-lg px-3 py-2 text-sm transition-all',
                      pathname === item.href
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-gray-500 hover:bg-primary/5 hover:text-primary',
                      isCollapsed ? 'justify-center' : 'justify-start'
                    )}
                  >
                    <item.icon className={cn('h-4 w-4', !isCollapsed && 'mr-2')} />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

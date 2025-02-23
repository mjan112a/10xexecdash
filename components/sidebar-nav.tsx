'use client';

import Link from 'next/link';
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
        <div className="flex h-14 items-center border-b px-3 py-4">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-gray-100 hover:text-gray-900 p-2 touch-manipulation"
          >
            <Menu className="h-6 w-6" />
            {!isCollapsed && <span className="ml-2">Navigation</span>}
          </button>
        </div>
        <div className="flex-1 overflow-auto py-2">
          {navItems.map((section, i) => (
            <div key={i} className="px-3 py-2">
              {!isCollapsed && (
                <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                  {section.category}
                </h2>
              )}
              <div className="space-y-1">
                {section.items.map((item, j) => (
                  <Link
                    key={j}
                    href={item.href}
                    className={cn(
                      'flex items-center rounded-lg px-3 py-2 text-sm transition-all hover:bg-gray-100',
                      pathname === item.href
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-500 hover:text-gray-900',
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

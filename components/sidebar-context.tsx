'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

type SidebarContextType = {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleSidebar = useCallback((value: boolean) => {
    console.log('Toggling sidebar to:', value);
    setIsCollapsed(value);
  }, []);
  
  // Set initial state based on screen size after mount
  useEffect(() => {
    const updateCollapsed = () => {
      const isLargeScreen = window.innerWidth >= 1024;
      toggleSidebar(!isLargeScreen);
    };
    
    // Initial setup
    updateCollapsed();
    
    // Handle resize
    window.addEventListener('resize', updateCollapsed);
    return () => window.removeEventListener('resize', updateCollapsed);
  }, [toggleSidebar]);

  const value = useMemo(() => ({
    isCollapsed,
    setIsCollapsed: toggleSidebar
  }), [isCollapsed, toggleSidebar]);

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

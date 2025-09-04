'use client';

import { usePathname } from 'next/navigation';
import React from 'react';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Footer is hidden on these paths (as implemented in Footer.tsx)
  const hideOnPages = ['/login', '/register'];
  const isDashboardRoute = pathname?.startsWith('/dashboard');
  const isAdminRoute = pathname?.startsWith('/dashboard/admin');
  const footerIsHidden = hideOnPages.includes(pathname || '') || isDashboardRoute || isAdminRoute;

  // Apply bottom padding only when footer is visible
  return (
    <div className={`min-h-screen ${footerIsHidden ? '' : 'pb-16'}`}>
      {children}
    </div>
  );
}


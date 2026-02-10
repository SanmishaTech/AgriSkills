'use client';

import { usePathname } from 'next/navigation';
import React from 'react';
import FloatingTranslator from '@/components/FloatingTranslator';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Footer is hidden on these paths (as implemented in Footer.tsx)
  const hideOnPages = ['/register', '/login'];
  const shouldHideFooter = hideOnPages.includes(pathname || '');
  const isDashboardRoute = pathname?.startsWith('/dashboard');
  const isAdminRoute = pathname?.startsWith('/dashboard/admin');
  const isTopicRoute = pathname?.startsWith('/topic/');
  const isLearnRoute = pathname?.startsWith('/learn');
  const isQuizRoute = pathname?.includes('/questions');
  const footerIsHidden = shouldHideFooter || isDashboardRoute || isAdminRoute || isTopicRoute || isLearnRoute || isQuizRoute;

  // Apply bottom padding only when footer is visible
  return (
    <div className={`min-h-screen ${footerIsHidden ? '' : 'pb-16'}`}>
      {children}
      <FloatingTranslator />
    </div>
  );
}


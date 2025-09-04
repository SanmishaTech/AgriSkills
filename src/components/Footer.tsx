'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home as HomeIcon, BookOpen, Mic } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  profilePhoto?: string;
}

export default function Footer() {
  // Avoid reading localStorage during initial render to keep SSR/CSR identical
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Don't show footer on auth pages only
  const hideOnPages = ['/login', '/register'];
  const shouldHideFooter = hideOnPages.includes(pathname);
  const isAdminRoute = pathname?.startsWith('/dashboard/admin');
  const isDashboardRoute = pathname?.startsWith('/dashboard');

  useEffect(() => {
    setMounted(true);
    try {
      const userData = localStorage.getItem('user');
      setUser(userData ? JSON.parse(userData) : null);
    } catch {
      setUser(null);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Hide footer for: auth pages and any dashboard/admin route. Keep visible for logged-in users on non-dashboard pages.
  if (shouldHideFooter || isDashboardRoute || isAdminRoute || !mounted) {
    return null;
  }

  // Removed login-specific footer; login should not show any footer

  // Render footer for both guests and authenticated users

  // Check if user is admin with explicit validation
  const isUserAdmin = user && user.role && user.role.toLowerCase().trim() === 'admin';
  
  // Dynamic destination for Learn
  const learnHref = user ? '/dashboard/user' : '/login';

  const menuItems = [
    {
      name: 'Home',
      href: '/',
      icon: <HomeIcon className="w-5 h-5" />,
    },
    {
      name: 'Learn',
      href: learnHref,
      icon: <BookOpen className="w-5 h-5" />,
    },
  ];

  return (
    <>
      {/* Bottom Navigation - Home | Speak | Learn */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200/70 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
        <div className="relative mx-auto max-w-3xl">
          <div className="flex justify-between items-center px-8 py-2">
            {/* Home */}
            <Link
              href={menuItems[0].href}
              className={`flex flex-col items-center text-xs ${pathname === menuItems[0].href ? 'text-amber-600' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
            >
              <div className="mb-0.5">{menuItems[0].icon}</div>
              <span>Home</span>
            </Link>

            {/* Spacer for center button */}
            <div className="w-20" />

            {/* Learn */}
            <Link
              href={learnHref}
              className={`flex flex-col items-center text-xs ${pathname?.startsWith('/dashboard') ? 'text-gray-700' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
            >
              <div className="mb-0.5">{menuItems[1].icon}</div>
              <span>Learn</span>
            </Link>
          </div>

          {/* Center Speak Button + Label */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <button
              type="button"
              onClick={() => {/* TODO: wire voice action */}}
              aria-label="Speak"
              className="bg-green-600 hover:bg-green-700 text-white rounded-full w-14 h-14 shadow-xl flex items-center justify-center ring-4 ring-white"
            >
              <Mic className="w-6 h-6" />
            </button>
            <span className="mt-1 text-xs font-medium text-green-700">Speak</span>
          </div>
        </div>
      </div>

      {/* Slide-up Menu Panel */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm transition-all duration-300 ease-in-out"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Slide-up Panel */}
          <div className={`
            fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md rounded-t-2xl shadow-2xl border-t border-gray-200/50
            transform transition-all duration-500 ease-out
            ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
          `}>
            <div className="p-4">
              {/* Handle bar */}
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4 transform transition-all duration-300 hover:bg-gray-400" />
              
              {/* User Info */}
              <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200/50">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-110">
                  <span className="text-white font-medium text-lg">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 transition-all duration-200">
                    {user.name || user.email}
                  </p>
                  <p className="text-xs text-gray-600">{user.email}</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 shadow-sm transform transition-all duration-200 hover:scale-105 ${
                    user.role === 'admin' 
                      ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300/50' 
                      : 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300/50'
                  }`}>
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Additional Menu Items */}
              <div className="space-y-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 w-full transition-all duration-300 ease-in-out transform hover:translate-x-1 hover:shadow-sm"
                >
                  <svg className="w-5 h-5 transition-transform duration-200 hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

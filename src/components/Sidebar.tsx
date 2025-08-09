'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  profilePhoto?: string;
}

export default function Sidebar() {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Don't show sidebar on login/register pages
  const hideOnPages = ['/login', '/register', '/'];
  const shouldHideSidebar = hideOnPages.includes(pathname);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('Sidebar - User data:', parsedUser);
        console.log('Sidebar - User role:', parsedUser.role);
        console.log('Sidebar - Is admin?:', parsedUser.role === 'admin');
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (shouldHideSidebar || !user) {
    return null;
  }

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H9L7 5H3a2 2 0 00-2 2z" />
        </svg>
      ),
    },
    ...(user.role === 'admin' ? [{
      name: 'Admin Panel',
      href: '/admin',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    }] : []),
    {
      name: 'Update Profile',
      href: '/profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Mobile menu button - always visible */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-90' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay for mobile - always active when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-all duration-300 ease-in-out"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - always mobile behavior */}
      <div
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white/95 backdrop-blur-md border-r border-gray-200/50 shadow-2xl
          transform transition-all duration-500 ease-out
          ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200/50 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-gray-900 transform transition-all duration-300 ease-in-out">
              Next Dashboard
            </h2>
            <button
              className="p-1 rounded-md hover:bg-gray-100 transform hover:rotate-180 transition-all duration-300 ease-in-out"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-indigo-50/50 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-110">
                <span className="text-white font-medium text-sm">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate transition-all duration-200">
                  {user.name || user.email}
                </p>
                <p className="text-xs text-gray-600 truncate">{user.email}</p>
                <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 shadow-sm transform transition-all duration-200 hover:scale-105 ${
                  user.role === 'admin' 
                    ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300/50' 
                    : 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300/50'
                }`}>
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-all duration-300 ease-in-out transform hover:translate-x-1
                    ${isActive 
                      ? 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-r-2 border-indigo-600 shadow-sm' 
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 hover:shadow-sm'
                    }
                  `}
                  onClick={() => setIsOpen(false)}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200/50">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 w-full transition-all duration-300 ease-in-out transform hover:translate-x-1 hover:shadow-sm"
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
  );
}

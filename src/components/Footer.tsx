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

export default function Footer() {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Don't show footer on login/register pages and topic pages
  const hideOnPages = ['/login', '/register', '/'];
  const shouldHideFooter = hideOnPages.includes(pathname) || pathname.startsWith('/topic/');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('Footer - User data:', parsedUser);
        console.log('Footer - User role:', parsedUser.role);
        console.log('Footer - Is admin?:', parsedUser.role === 'admin');
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

  if (shouldHideFooter || !user) {
    return null;
  }

  // Check if user is admin with explicit validation
  const isUserAdmin = user && user.role && user.role.toLowerCase().trim() === 'admin';
  
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
    {
      name: 'Profile',
      href: '/profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Bottom Navigation Menu - Mobile Style */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around items-center py-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex flex-col items-center px-3 py-2 text-xs transition-colors
                  ${isActive 
                    ? 'text-indigo-600' 
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <div className={isActive ? 'text-indigo-600' : 'text-gray-600'}>
                  {item.icon}
                </div>
                <span className="mt-1">{item.name}</span>
              </Link>
            );
          })}
          
          {/* Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex flex-col items-center px-3 py-2 text-xs text-gray-600 hover:text-gray-900 transition-all duration-200 transform hover:scale-105"
          >
            <svg className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="mt-1">Menu</span>
          </button>
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

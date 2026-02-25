'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowLeft, Menu, Globe, Headphones } from 'lucide-react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import Image from 'next/image';

interface HomeNavbarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    isMobileSearchActive: boolean;
    setIsMobileSearchActive: (active: boolean) => void;
    onExploreClick?: () => void;
}

export default function HomeNavbar({
    searchQuery,
    setSearchQuery,
    isMobileSearchActive,
    setIsMobileSearchActive,
    onExploreClick
}: HomeNavbarProps) {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);

    // For the Help dialog (stub state)
    const [showHelpDialog, setShowHelpDialog] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
            setUser(JSON.parse(userData));
            setIsAuthenticated(true);
        }
        setAuthLoading(false);
    }, []);

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="w-full px-4 sm:px-6 lg:px-8 relative">
                <div className="flex items-center justify-between sm:justify-start h-[72px] relative">

                    {/* Mobile Search Header (Animated) */}
                    <AnimatePresence>
                        {(isMobileSearchActive || searchQuery.length > 0) && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="absolute inset-0 bg-white z-20 flex items-center px-2 gap-2 sm:hidden h-full"
                            >
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setIsMobileSearchActive(false);
                                    }}
                                    className="p-2 text-gray-700 hover:text-green-600 transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
                                </button>
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="search"
                                        autoFocus
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Search for anything..."
                                        className="w-full pl-9 pr-10 py-2 bg-white border border-gray-900 rounded-full text-sm placeholder-gray-500 focus:outline-none transition-colors cursor-text"
                                    />
                                    {searchQuery.length > 0 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSearchQuery('');
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-0.5"
                                        >
                                            <X className="w-4 h-4" strokeWidth={2} />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Mobile Sidebar (Hamburger) & Logo Container */}
                    <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 z-10 w-auto">
                        {/* Hamburger Menu (Mobile/Tablet) */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <button className="lg:hidden p-2 -ml-2 text-gray-700 hover:text-green-600 transition-colors">
                                    <Menu className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
                                </button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[300px] sm:w-[400px] px-6 pt-12 flex flex-col h-[100dvh]">
                                <SheetTitle className="sr-only">Menu</SheetTitle>

                                {/* Top Navigation Links */}
                                <div className="flex flex-col gap-6 flex-1 overflow-y-auto">
                                    <button
                                        onClick={() => {
                                            if (onExploreClick) onExploreClick();
                                            else {
                                                router.push('/');
                                                setTimeout(() => {
                                                    document.getElementById('topics-section')?.scrollIntoView({ behavior: 'smooth' });
                                                }, 500);
                                            }
                                        }}
                                        className="text-left text-lg font-medium text-gray-800 hover:text-green-600 transition-colors"
                                    >
                                        Explore Topics
                                    </button>
                                    {!authLoading && isAuthenticated && (
                                        <button
                                            onClick={() => router.push(user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/user')}
                                            className="text-left text-lg font-medium text-gray-800 hover:text-green-600 transition-colors"
                                        >
                                            Dashboard
                                        </button>
                                    )}
                                </div>

                                {/* Bottom Auth & Profile Links */}
                                <div className="flex flex-col gap-4 pb-6 pt-6 border-t border-gray-100 mt-auto">
                                    {!authLoading && isAuthenticated ? (
                                        <>
                                            <button
                                                onClick={() => router.push(user?.role === 'admin' ? '/dashboard/admin/profile' : '/dashboard/user/profile')}
                                                className="text-left text-lg font-medium text-gray-800 hover:text-green-600 transition-colors"
                                            >
                                                Profile
                                            </button>
                                            <button
                                                onClick={() => router.push(user?.role === 'admin' ? '/dashboard/admin/settings' : '/dashboard/user/settings')}
                                                className="text-left text-lg font-medium text-gray-800 hover:text-green-600 transition-colors"
                                            >
                                                Update Password
                                            </button>
                                            <button
                                                onClick={() => {
                                                    localStorage.removeItem('token');
                                                    localStorage.removeItem('user');
                                                    setUser(null);
                                                    setIsAuthenticated(false);
                                                    router.push('/');
                                                }}
                                                className="text-left text-lg font-medium text-red-600 hover:text-red-700 transition-colors"
                                            >
                                                Logout
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => router.push('/login')}
                                                className="w-full py-3 border border-gray-900 text-gray-900 text-lg font-bold rounded-sm hover:bg-gray-50 transition-colors"
                                            >
                                                Log in
                                            </button>
                                            <button
                                                onClick={() => router.push('/login')}
                                                className="w-full py-3 bg-gray-900 border border-gray-900 text-white text-lg font-bold rounded-sm hover:bg-gray-800 transition-colors"
                                            >
                                                Sign up
                                            </button>
                                        </>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>

                        {/* Desktop Logo (Hidden on mobile) */}
                        <button
                            onClick={() => { router.push('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className="hidden sm:flex items-center hover:opacity-80 transition-opacity overflow-hidden h-[60px] w-[160px] flex-shrink-0"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/images/logo.png" alt="Logo" className="h-[60px] w-[160px] object-contain" style={{ transform: 'scale(2.2)' }} />
                        </button>
                    </div>

                    {/* Mobile Centered Logo */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 sm:hidden z-0 cursor-pointer overflow-hidden h-[44px] w-[120px]" onClick={() => { router.push('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/logo.png" alt="Logo" className="h-[50px] w-[120px] object-contain" style={{ transform: 'scale(2.2)' }} />
                    </div>

                    {/* Search bar — Center & Expandable like Udemy */}
                    <div className="hidden sm:block flex-1 min-w-0 mx-2 lg:mx-4">
                        <div className="relative flex items-center w-full max-w-full">
                            <Search className="absolute left-4 w-5 h-5 text-gray-500" />
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search for anything..."
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-900 rounded-full text-sm placeholder-gray-500 focus:outline-none focus:bg-white transition-colors"
                            />
                        </div>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-4 sm:gap-5 flex-shrink-0 z-10 w-auto">
                        {/* Mobile Right Icons (Search) */}
                        <div className="flex sm:hidden items-center gap-4">
                            <button
                                onClick={() => setIsMobileSearchActive(true)}
                                className="text-gray-900 hover:text-green-600 transition-colors"
                                aria-label="Search"
                            >
                                <Search className="w-5 h-5" strokeWidth={1.5} />
                            </button>
                        </div>

                        {/* Desktop Text Links */}
                        {!authLoading && isAuthenticated && (
                            <div className="hidden lg:flex items-center gap-5">
                                <button
                                    onClick={() => router.push(user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/user')}
                                    className="text-sm font-normal text-gray-700 hover:text-green-600 transition-colors"
                                >
                                    Dashboard
                                </button>
                                <button
                                    onClick={() => {
                                        localStorage.removeItem('token');
                                        localStorage.removeItem('user');
                                        setUser(null);
                                        setIsAuthenticated(false);
                                        router.push('/');
                                    }}
                                    className="text-sm font-normal text-gray-700 hover:text-green-600 transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        )}

                        {/* Utility Icons (Clean, no background) */}
                        <div className="hidden sm:flex items-center gap-4 text-gray-600">
                            <button
                                className="hover:text-green-600 transition-colors"
                                title="Language"
                                onClick={() => window.dispatchEvent(new Event('open-language-picker'))}
                            >
                                <Globe className="w-5 h-5" />
                            </button>
                            <button
                                className="hover:text-green-600 transition-colors"
                                title="Support"
                                onClick={() => router.push('/help')}
                            >
                                <Headphones className="w-5 h-5" />
                            </button>
                            <button
                                className="hover:text-green-600 transition-colors"
                                title="Help"
                                onClick={() => setShowHelpDialog(true)}
                            >
                                <QuestionMarkCircleIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Auth buttons & Avatar (Desktop Only in this container) */}
                        <div className="hidden sm:block">
                            {!authLoading && (
                                isAuthenticated ? (
                                    <div className="flex items-center gap-4 border-l border-gray-200 pl-5">
                                        {/* Avatar circle */}
                                        <div onClick={() => router.push(user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/user')} className="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-green-700 transition-colors">
                                            <span className="text-white text-sm font-bold">
                                                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => router.push('/login')}
                                            className="text-sm font-bold text-gray-900 border border-gray-900 hover:bg-gray-100 px-4 py-2 rounded-sm transition-colors whitespace-nowrap"
                                        >
                                            Log in
                                        </button>
                                        <button
                                            onClick={() => router.push('/login')}
                                            className="text-sm font-bold bg-gray-900 hover:bg-gray-800 text-white border border-gray-900 px-4 py-2 rounded-sm transition-colors whitespace-nowrap hidden sm:block"
                                        >
                                            Sign up
                                        </button>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

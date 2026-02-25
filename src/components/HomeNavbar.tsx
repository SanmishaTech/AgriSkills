'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowLeft, Menu, Globe, Headphones, Home as HomeIcon, BookOpen, Compass, LayoutDashboard, MessageCircle, User as UserIcon, KeyRound, LogOut } from 'lucide-react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import Image from 'next/image';

function getPageHelp(pathname: string): { title: string; description: string } {
    const p = pathname.replace(/\/$/, '') || '/';
    if (p === '/') return { title: 'Home', description: 'Welcome to GramKushal! Browse topics, watch shorts, explore success stories, and start your learning journey.' };
    if (p === '/dashboard/user') return { title: 'Your Dashboard', description: 'This is your personal dashboard. See your enrolled courses, track progress, and access certificates.' };
    if (p === '/dashboard' || p === '/dashboard/admin') return { title: 'Admin Dashboard', description: 'Admin control panel. Manage courses, topics, quizzes, users, and support tickets.' };
    if (p.startsWith('/dashboard/admin/topics') && p.includes('/demo')) return { title: 'Topic Demo Management', description: 'Manage demo videos and content for this topic.' };
    if (p.startsWith('/dashboard/admin/topics') && p.includes('/questions')) return { title: 'Topic Questions', description: 'Manage discussion questions for this topic.' };
    if (p.match(/^\/dashboard\/admin\/topics\/[^/]+$/)) return { title: 'Edit Topic', description: 'Edit topic details including name, description, icon, and content.' };
    if (p === '/dashboard/admin/topics') return { title: 'Topics Management', description: 'View and manage all topics. Create new topics or edit existing ones.' };
    if (p.match(/^\/dashboard\/admin\/courses\/[^/]+\/chapters$/)) return { title: 'Course Chapters', description: 'Manage chapters for this course. Add, reorder, or edit chapter content.' };
    if (p === '/dashboard/admin/courses/add') return { title: 'Add New Course', description: 'Create a new course by filling in the details.' };
    if (p.startsWith('/dashboard/admin/chapters') && p.includes('/quiz')) return { title: 'Chapter Quiz', description: 'Create and manage quiz questions for this chapter.' };
    if (p === '/dashboard/admin/courses') return { title: 'Courses Management', description: 'View, create, and manage all courses.' };
    if (p === '/dashboard/admin/quizzes') return { title: 'Quizzes', description: 'View and manage all quizzes across the platform.' };
    if (p.startsWith('/course/') && p.endsWith('/chapters')) return { title: 'Course Content', description: 'View chapters in this course. Complete each chapter and take quizzes to earn your certificate.' };
    if (p.startsWith('/quiz/')) return { title: 'Quiz', description: 'Answer the questions to test your knowledge. You need to pass to unlock the next chapter.' };
    if (p.startsWith('/topic/')) return { title: 'Topic Details', description: 'Explore this topic, watch demos, and enroll in available courses.' };
    if (p === '/learn') return { title: 'Learn', description: 'Browse all available topics and courses to continue your learning journey.' };
    if (p === '/help') return { title: 'Help & Support', description: 'Send us your questions or concerns and we will get back to you.' };
    if (p === '/success-stories') return { title: 'Success Stories', description: 'Read inspiring stories from farmers who have benefited from GramKushal.' };
    if (p === '/profile') return { title: 'Your Profile', description: 'View and update your profile information.' };
    return { title: 'Help', description: 'This page is part of the GramKushal platform. Use the navigation to explore courses, topics, and more.' };
}

interface HomeNavbarProps {
    searchQuery?: string;
    setSearchQuery?: (query: string) => void;
    isMobileSearchActive?: boolean;
    setIsMobileSearchActive?: (active: boolean) => void;
    onExploreClick?: () => void;
}

export default function HomeNavbar({
    searchQuery: externalSearchQuery,
    setSearchQuery: externalSetSearchQuery,
    isMobileSearchActive: externalMobileSearch,
    setIsMobileSearchActive: externalSetMobileSearch,
    onExploreClick
}: HomeNavbarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    // Internal search state (used when no external props are provided)
    const [internalSearchQuery, setInternalSearchQuery] = useState('');
    const [internalMobileSearch, setInternalMobileSearch] = useState(false);

    // Use external props if provided, otherwise use internal state
    const searchQuery = externalSearchQuery ?? internalSearchQuery;
    const setSearchQuery = externalSetSearchQuery ?? setInternalSearchQuery;
    const isMobileSearchActive = externalMobileSearch ?? internalMobileSearch;
    const setIsMobileSearchActive = externalSetMobileSearch ?? setInternalMobileSearch;

    // For the Help dialog (stub state)
    const [showHelpDialog, setShowHelpDialog] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const closeSidebar = () => setSidebarOpen(false);

    // Navigate to home page with search query when pressing Enter on non-home pages
    const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            const pagesWithSearch = ['/', '/success-stories'];
            if (!pagesWithSearch.includes(pathname || '')) {
                router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
            }
        }
    };

    // Always hide on auth pages; hide on '/' and '/success-stories' only when no external search props
    // (those pages render their own HomeNavbar with search props)
    const authPages = ['/login', '/register'];
    const pagesWithOwnNavbar = ['/', '/success-stories'];
    const isPageWithOwnNavbar = pagesWithOwnNavbar.includes(pathname || '') && !externalSetSearchQuery;
    const shouldHide = authPages.includes(pathname || '') || isPageWithOwnNavbar;

    useEffect(() => {
        setMounted(true);
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
            setUser(JSON.parse(userData));
            setIsAuthenticated(true);
        }
        setAuthLoading(false);
    }, [pathname]);

    if (shouldHide || !mounted) return null;

    return (
        <>
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
                                            onKeyDown={handleSearchSubmit}
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
                            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                                <SheetTrigger asChild>
                                    <button className="lg:hidden p-2 -ml-2 text-gray-700 hover:text-green-600 transition-colors">
                                        <Menu className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
                                    </button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0 flex flex-col h-[100dvh] border-r-0">
                                    <SheetTitle className="sr-only">Menu</SheetTitle>

                                    {/* Branded Header */}
                                    <div className="px-6 pt-8 pb-5 bg-gradient-to-br from-green-600 to-green-700">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src="/images/logo.png" alt="Logo" className="h-[28px] w-[28px] object-contain" style={{ transform: 'scale(2.5)' }} />
                                            </div>
                                            <div>
                                                <p className="text-white font-bold text-lg leading-tight">GramKushal</p>
                                                <p className="text-green-100 text-xs">Learn. Grow. Succeed.</p>
                                            </div>
                                        </div>
                                        {!authLoading && isAuthenticated && user && (
                                            <div className="mt-4 flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2.5">
                                                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-white text-sm font-bold">
                                                        {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-white text-sm font-semibold truncate">{user?.name || 'User'}</p>
                                                    <p className="text-green-100 text-xs truncate">{user?.email || ''}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Navigation Links */}
                                    <div className="flex-1 overflow-y-auto px-4 py-4">
                                        {/* Main Navigation */}
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Navigation</p>
                                        <nav className="flex flex-col gap-1">
                                            <button
                                                onClick={() => { closeSidebar(); router.push('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors text-left"
                                            >
                                                <HomeIcon className="w-5 h-5" />
                                                <span className="text-[15px] font-medium">Home</span>
                                            </button>
                                            <button
                                                onClick={() => { closeSidebar(); router.push('/learn'); }}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors text-left"
                                            >
                                                <BookOpen className="w-5 h-5" />
                                                <span className="text-[15px] font-medium">Learn</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    closeSidebar();
                                                    if (onExploreClick) onExploreClick();
                                                    else {
                                                        router.push('/');
                                                        setTimeout(() => {
                                                            document.getElementById('topics-section')?.scrollIntoView({ behavior: 'smooth' });
                                                        }, 500);
                                                    }
                                                }}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors text-left"
                                            >
                                                <Compass className="w-5 h-5" />
                                                <span className="text-[15px] font-medium">Explore Topics</span>
                                            </button>
                                            {!authLoading && isAuthenticated && (
                                                <>
                                                    <button
                                                        onClick={() => { closeSidebar(); router.push(user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/user'); }}
                                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors text-left"
                                                    >
                                                        <LayoutDashboard className="w-5 h-5" />
                                                        <span className="text-[15px] font-medium">Dashboard</span>
                                                    </button>
                                                    <button
                                                        onClick={() => { closeSidebar(); router.push('/certificates'); }}
                                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors text-left"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></svg>
                                                        <span className="text-[15px] font-medium">Certificates</span>
                                                    </button>
                                                </>
                                            )}
                                        </nav>

                                        {/* Divider */}
                                        <div className="my-4 border-t border-gray-100" />

                                        {/* Support */}
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Support</p>
                                        <nav className="flex flex-col gap-1">
                                            <button
                                                onClick={() => { closeSidebar(); router.push('/help'); }}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors text-left"
                                            >
                                                <MessageCircle className="w-5 h-5" />
                                                <span className="text-[15px] font-medium">Contact Us</span>
                                            </button>
                                            <button
                                                onClick={() => { closeSidebar(); window.dispatchEvent(new Event('open-language-picker')); }}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors text-left"
                                            >
                                                <Globe className="w-5 h-5" />
                                                <span className="text-[15px] font-medium">Language</span>
                                            </button>
                                        </nav>
                                    </div>

                                    {/* Bottom Auth & Profile Section */}
                                    <div className="px-4 pb-6 pt-3 border-t border-gray-100 mt-auto bg-gray-50/50">
                                        {!authLoading && isAuthenticated ? (
                                            <nav className="flex flex-col gap-1">
                                                <button
                                                    onClick={() => { closeSidebar(); router.push('/profile'); }}
                                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-left"
                                                >
                                                    <UserIcon className="w-5 h-5" />
                                                    <span className="text-[15px] font-medium">Profile</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        closeSidebar();
                                                        localStorage.removeItem('token');
                                                        localStorage.removeItem('user');
                                                        setUser(null);
                                                        setIsAuthenticated(false);
                                                        router.push('/');
                                                    }}
                                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-left"
                                                >
                                                    <LogOut className="w-5 h-5" />
                                                    <span className="text-[15px] font-medium">Logout</span>
                                                </button>
                                            </nav>
                                        ) : (
                                            <div className="flex flex-col gap-3">
                                                <button
                                                    onClick={() => router.push('/login')}
                                                    className="w-full py-3 border-2 border-green-600 text-green-700 text-base font-bold rounded-xl hover:bg-green-50 transition-colors"
                                                >
                                                    Log in
                                                </button>
                                                <button
                                                    onClick={() => router.push('/login')}
                                                    className="w-full py-3 bg-green-600 text-white text-base font-bold rounded-xl hover:bg-green-700 transition-colors"
                                                >
                                                    Sign up
                                                </button>
                                            </div>
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
                                    onKeyDown={handleSearchSubmit}
                                    placeholder="Search for anything..."
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-900 rounded-full text-sm placeholder-gray-500 focus:outline-none focus:bg-white transition-colors"
                                />
                            </div>
                        </div>

                        {/* Right actions */}
                        <div className="flex items-center gap-4 sm:gap-5 flex-shrink-0 z-10 w-auto">
                            {/* Mobile Right Icons (Search & Language) */}
                            <div className="flex sm:hidden items-center gap-4">
                                <button
                                    className="text-gray-900 hover:text-green-600 transition-colors"
                                    aria-label="Language"
                                    onClick={() => window.dispatchEvent(new Event('open-language-picker'))}
                                >
                                    <Globe className="w-5 h-5" strokeWidth={1.5} />
                                </button>
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
                                        onClick={() => { router.push('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        className="text-sm font-normal text-gray-700 hover:text-green-600 transition-colors"
                                    >
                                        Home
                                    </button>
                                    <button
                                        onClick={() => router.push('/learn')}
                                        className="text-sm font-normal text-gray-700 hover:text-green-600 transition-colors"
                                    >
                                        Learn
                                    </button>
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
                                            <div onClick={() => router.push('/profile')} className="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-green-700 transition-colors">
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

            {/* Help Dialog */}
            {showHelpDialog && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowHelpDialog(false)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center">
                                    <QuestionMarkCircleIcon className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">{getPageHelp(pathname || '/').title}</h3>
                            </div>
                            <button
                                onClick={() => setShowHelpDialog(false)}
                                className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="px-5 py-4">
                            <p className="text-gray-700 text-sm leading-relaxed">{getPageHelp(pathname || '/').description}</p>
                        </div>
                        <div className="px-5 pb-4">
                            <button
                                onClick={() => setShowHelpDialog(false)}
                                className="w-full py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium text-sm hover:from-green-700 hover:to-green-800 transition-all active:scale-[0.98]"
                            >
                                Got it!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

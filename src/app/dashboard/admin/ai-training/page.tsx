'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AiTrainingPage() {
    const [knowledgeBase, setKnowledgeBase] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const router = useRouter();

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsFullscreen(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (userData && token) {
            const parsedUser = JSON.parse(userData);
            if (parsedUser.role !== 'admin') {
                router.push('/dashboard');
            } else {
                fetchConfig(token);
            }
        } else {
            router.push('/login');
        }
    }, [router]);

    const fetchConfig = async (token: string) => {
        try {
            const response = await fetch('/api/admin/config?key=llm_knowledge_base', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.config) {
                setKnowledgeBase(data.config.value);
            }
        } catch (err) {
            console.error('Failed to fetch config:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setStatus(null);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/config', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ key: 'llm_knowledge_base', value: knowledgeBase })
            });

            if (!response.ok) throw new Error('Failed to save');

            setStatus({ type: 'success', message: 'Knowledge base updated successfully!' });
        } catch (err) {
            setStatus({ type: 'error', message: 'Error saving knowledge base. Please try again.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <button 
                            onClick={() => router.push('/dashboard/admin')}
                            className="text-indigo-600 hover:text-indigo-800 flex items-center mb-2 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Admin
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                            <span className="bg-indigo-100 p-2 rounded-lg mr-3">
                                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </span>
                            AI Training Center
                        </h1>
                        <p className="text-gray-600 mt-2">Update the knowledge base for GramKushal AI (Chat Only).</p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-6 sm:p-8">
                        <div className="mb-6 text-gray-700">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-semibold">
                                    Knowledge Base / LLM Context
                                </label>
                                <button 
                                    onClick={() => setIsFullscreen(true)}
                                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center transition-colors group"
                                >
                                    <svg className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                    </svg>
                                    Go Full Screen
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mb-4">
                                Paste all the facts, descriptions, and instructions you want the AI to remember. 
                                This will be given to the AI as context for every conversation.
                            </p>
                            
                            {isLoading ? (
                                <div className="h-64 bg-gray-50 rounded-xl animate-pulse flex items-center justify-center">
                                    <div className="text-gray-400">Loading current context...</div>
                                </div>
                            ) : (
                                <textarea
                                    value={knowledgeBase}
                                    onChange={(e) => setKnowledgeBase(e.target.value)}
                                    placeholder="e.g. GramKushal was founded in 2024. Our main courses are about Drip Irrigation and Soil Health. Be extra polite to new farmers..."
                                    className="w-full h-96 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none text-gray-800 scrollbar-thin"
                                />
                            )}
                        </div>

                        {status && (
                            <div className={`mb-6 p-4 rounded-xl flex items-center ${
                                status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                                {status.type === 'success' ? (
                                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                )}
                                <span className="font-medium">{status.message}</span>
                            </div>
                        )}

                        <div className="flex items-center justify-end space-x-4">
                            <button
                                onClick={() => setKnowledgeBase('')}
                                className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                                disabled={isSaving}
                            >
                                Clear All
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || isLoading}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                {isSaving && (
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                                {isSaving ? 'Saving...' : 'Save Knowledge Base'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info Card */}
                <div className="mt-8 bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
                    <h3 className="text-indigo-900 font-bold flex items-center mb-3">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z" clipRule="evenodd" />
                        </svg>
                        What should I put here?
                    </h3>
                    <ul className="space-y-2 text-indigo-800 text-sm">
                        <li>• <strong>General Info:</strong> Company history, mission, and vision.</li>
                        <li>• <strong>Product/Course Details:</strong> Specific info about your courses that might not be in the dynamic list.</li>
                        <li>• <strong>Personality:</strong> Describe if the AI should be funny, serious, or helpful in a specific way.</li>
                        <li>• <strong>FAQ:</strong> Common questions and their exact answers.</li>
                    </ul>
                </div>
            </div>

            {/* Full Screen Editor Overlay */}
            {isFullscreen && (
                <div className="fixed inset-0 z-[100] bg-white p-4 sm:p-8 flex flex-col animate-in fade-in zoom-in duration-200">
                    <div className="max-w-6xl mx-auto w-full h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                                    <span className="bg-indigo-100 p-1.5 rounded-lg mr-3">
                                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </span>
                                    Knowledge Base Editor
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">Press ESC to exit full screen mode</p>
                            </div>
                            <button 
                                onClick={() => setIsFullscreen(false)}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2.5 rounded-xl transition-all hover:rotate-90"
                                title="Exit Full Screen"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <textarea
                            value={knowledgeBase}
                            onChange={(e) => setKnowledgeBase(e.target.value)}
                            className="flex-1 w-full p-8 text-lg border-2 border-indigo-50 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all resize-none text-gray-800 shadow-inner scrollbar-thin font-mono leading-relaxed"
                            placeholder="Type or paste your knowledge base here..."
                            autoFocus
                        />
                        
                        <div className="mt-6 flex items-center justify-between bg-gray-50 p-4 rounded-2xl">
                            <span className="text-sm text-gray-500 font-medium">
                                Character Count: {knowledgeBase.length}
                            </span>
                            <button
                                onClick={() => setIsFullscreen(false)}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all"
                            >
                                Finish Editing
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

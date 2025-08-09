'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

// Component that uses search params - must be wrapped in Suspense
function ChapterPreviewContent() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get chapter data from URL parameters
  const chapterData = {
    title: searchParams.get('title') || '',
    description: searchParams.get('description') || '',
    content: searchParams.get('content') || '',
    youtubeUrl: searchParams.get('youtubeUrl') || '',
    orderIndex: parseInt(searchParams.get('orderIndex') || '0'),
    isActive: searchParams.get('isActive') === 'true',
    courseTitle: searchParams.get('courseTitle') || 'Course',
    chapterIndex: parseInt(searchParams.get('chapterIndex') || '1')
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'admin') {
        router.push('/dashboard');
      } else {
        setUser(parsedUser);
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  const getYoutubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const regex = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&\?]*).*/;
    const match = url.match(regex);
    return (match && match[1].length === 11) ? match[1] : null;
  };

  const handleGoBack = () => {
    window.close();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!chapterData.title) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-medium">Error: No chapter data found</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleGoBack}
                  className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-4xl font-bold mb-2">Chapter Preview</h1>
                  <p className="text-indigo-100 text-lg">{chapterData.courseTitle}</p>
                </div>
              </div>
              <div className="hidden md:block">
                <svg className="w-24 h-24 text-white/20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Chapter Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Chapter Header */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-bold">
                  Chapter {chapterData.chapterIndex}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  chapterData.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {chapterData.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <span className="text-sm text-gray-500">Order: {chapterData.orderIndex}</span>
            </div>
          </div>

          <div className="p-8">
            {/* Chapter Title */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">{chapterData.title}</h2>
              {chapterData.description && (
                <p className="text-lg text-gray-600">{chapterData.description}</p>
              )}
            </div>

            {/* YouTube Video */}
            {chapterData.youtubeUrl && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Video Content</h3>
                <div className="bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                  <div className="aspect-video">
                    {(() => {
                      const videoId = getYoutubeVideoId(chapterData.youtubeUrl);
                      return videoId ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${videoId}`}
                          title={`${chapterData.title} - Video`}
                          className="w-full h-full"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-red-50">
                          <div className="text-center">
                            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <p className="text-red-600 font-medium">Invalid YouTube URL</p>
                            <p className="text-red-500 text-sm mt-1">{chapterData.youtubeUrl}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Chapter Content */}
            {chapterData.content && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Chapter Content</h3>
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                  <div 
                    className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: chapterData.content }}
                  />
                </div>
              </div>
            )}

            {/* Chapter Metadata */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Chapter Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="bg-blue-100 rounded-lg p-2 mr-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Course</p>
                      <p className="text-blue-700 font-semibold">{chapterData.courseTitle}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="bg-green-100 rounded-lg p-2 mr-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-900">Status</p>
                      <p className="text-green-700 font-semibold">{chapterData.isActive ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="bg-purple-100 rounded-lg p-2 mr-3">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-900">Chapter</p>
                      <p className="text-purple-700 font-semibold">#{chapterData.chapterIndex}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="bg-orange-100 rounded-lg p-2 mr-3">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-orange-900">Order</p>
                      <p className="text-orange-700 font-semibold">{chapterData.orderIndex}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleGoBack}
            className="bg-gray-600 text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors shadow-sm"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function ChapterPreviewLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-500">Loading preview...</p>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense wrapper
export default function ChapterPreviewPage() {
  return (
    <Suspense fallback={<ChapterPreviewLoading />}>
      <ChapterPreviewContent />
    </Suspense>
  );
}

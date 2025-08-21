'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Editor } from 'primereact/editor';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface Topic {
  id: string;
  title: string;
  description: string | null;
  thumbnail?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DemoData {
  demoUrls: string[];
  content: string;
}

export default function AdminTopicDemo() {
  const [user, setUser] = useState<User | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Demo data state
  const [demoUrls, setDemoUrls] = useState<string[]>(['', '', '', '', '']);
  const [content, setContent] = useState<string>('');
  
  const router = useRouter();
  const params = useParams();
  const topicId = params.id as string;

  // Ensure we always render exactly 5 inputs by padding with empty strings
  const padToFive = (arr: string[] = []) => {
    return [...arr, '', '', '', '', ''].slice(0, 5);
  };

  const fetchTopicAndDemo = useCallback(async (token: string) => {
    try {
      // Fetch topic details
      const topicResponse = await fetch(`/api/admin/topics/${topicId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!topicResponse.ok) {
        throw new Error('Failed to fetch topic');
      }

      const topicData = await topicResponse.json();
      setTopic(topicData.topic);

      // Fetch demo data (you'll need to create this API endpoint)
      try {
        const demoResponse = await fetch(`/api/admin/topics/${topicId}/demo`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (demoResponse.ok) {
          const demoData = await demoResponse.json();
          if (demoData.demo) {
            setDemoUrls(padToFive(demoData.demo.demoUrls));
            setContent(demoData.demo.content || '');
          }
        }
      } catch (demoErr) {
        // Demo data doesn't exist yet, use defaults
        console.log('No demo data found, using defaults');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'admin') {
        router.push('/dashboard');
      } else {
        setUser(parsedUser);
        fetchTopicAndDemo(token);
      }
    } else {
      router.push('/login');
    }
  }, [router, fetchTopicAndDemo]);

  const validateYouTubeUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Empty URLs are valid
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[\w-]+/;
    return youtubeRegex.test(url);
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...demoUrls];
    newUrls[index] = value;
    setDemoUrls(newUrls);
    
    // Clear success message when user starts editing
    if (success) setSuccess(null);
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    
    // Clear success message when user starts editing
    if (success) setSuccess(null);
  };

  const handleSave = async () => {
    // Validate YouTube URLs
    for (let i = 0; i < demoUrls.length; i++) {
      if (demoUrls[i] && !validateYouTubeUrl(demoUrls[i])) {
        setError(`Invalid YouTube URL in field ${i + 1}. Please enter a valid YouTube or YouTube Shorts URL.`);
        return;
      }
    }

    setSaving(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/topics/${topicId}/demo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          // Preserve exactly 5 slots; trim but do not remove empties so positions persist
          demoUrls: padToFive(demoUrls.map((u) => u.trim())),
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save demo data');
      }

      setSuccess('Demo content saved successfully!');
      
      // Navigate to topic details after a brief delay
      setTimeout(() => {
        router.push(`/dashboard/admin/topics/${topicId}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const getThumbnailUrl = (url: string): string => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '';
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-500">Loading demo management...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !topic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-medium">Error: {error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-4xl font-bold mb-2">Demo Videos & Content</h1>
                  <p className="text-blue-100 text-lg">{topic?.title}</p>
                </div>
              </div>
              <div className="hidden md:block">
                <svg className="w-24 h-24 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-800 font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Demo URLs Section */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 rounded-lg p-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Demo Videos</h2>
                <p className="text-sm text-gray-600 mt-1">Add up to 5 YouTube video URLs (regular videos or Shorts)</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {demoUrls.map((url, index) => (
                <div key={index} className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Demo Video {index + 1} {index === 0 && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => handleUrlChange(index, e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or https://www.youtube.com/shorts/..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  
                  {/* Video Preview */}
                  {url && validateYouTubeUrl(url) && (
                    <div className="mt-3">
                      <div className="relative group">
                        <img
                          src={getThumbnailUrl(url)}
                          alt={`Demo video ${index + 1} thumbnail`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Invalid URL Error */}
                  {url && !validateYouTubeUrl(url) && (
                    <p className="text-sm text-red-600 mt-1">
                      Please enter a valid YouTube URL
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 rounded-lg p-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Topic Description Content</h2>
                <p className="text-sm text-gray-600 mt-1">Write detailed content describing this topic</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Content <span className="text-red-500">*</span>
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent">
                <Editor
                  value={content}
                  onTextChange={(e) => handleContentChange(e.htmlValue || '')}
                  style={{ height: '320px' }}
                  placeholder="Write detailed content about this topic..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-3 shadow-lg"
          >
            {saving && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            )}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{saving ? 'Saving...' : 'Save Demo Content'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Editor } from 'primereact/editor';

interface Subtopic {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  topicId: string;
}

interface Topic {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subtopics?: Subtopic[];
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export default function AddCoursePage() {
  const [user, setUser] = useState<User | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    content: '',
    youtubeUrl: '',
    isActive: true,
    subtopicId: ''
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedSubtopicId = searchParams.get('subtopicId');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'admin') {
        router.push('/dashboard');
      } else {
        setUser(parsedUser);
        fetchTopicsWithSubtopics(token);
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (preSelectedSubtopicId) {
      setCourseForm(prev => ({ ...prev, subtopicId: preSelectedSubtopicId }));
    }
  }, [preSelectedSubtopicId]);

  const fetchTopicsWithSubtopics = async (token: string) => {
    try {
      const response = await fetch('/api/admin/topics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch topics');
      }

      const data = await response.json();
      setTopics(data.topics || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async () => {
    if (!courseForm.title.trim() || !courseForm.content.trim() || !courseForm.subtopicId) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(courseForm),
      });

      if (!response.ok) {
        throw new Error('Failed to create course');
      }

      // Navigate back to the topic detail page
      const selectedSubtopic = getAllSubtopics().find(s => s.id === courseForm.subtopicId);
      if (selectedSubtopic) {
        router.push(`/dashboard/admin/topics/${selectedSubtopic.topicId}`);
      } else {
        router.push('/dashboard/admin/topics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAllSubtopics = (): Subtopic[] => {
    return topics.flatMap(topic => topic.subtopics || []);
  };

  const handlePreview = () => {
    // Get selected subtopic and topic info for preview
    const selectedSubtopic = getAllSubtopics().find(s => s.id === courseForm.subtopicId);
    const selectedTopic = topics.find(topic => 
      topic.subtopics?.some(subtopic => subtopic.id === courseForm.subtopicId)
    );

    // Create URL parameters for preview
    const params = new URLSearchParams({
      title: courseForm.title,
      description: courseForm.description,
      content: courseForm.content,
      youtubeUrl: courseForm.youtubeUrl,
      isActive: courseForm.isActive.toString(),
      subtopicId: courseForm.subtopicId,
      subtopicTitle: selectedSubtopic?.title || 'Subtopic',
      topicTitle: selectedTopic?.title || 'Topic'
    });

    // Open preview in new tab
    window.open(`/dashboard/admin/courses/preview?${params.toString()}`, '_blank');
  };

  const getYoutubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const regex = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&\?]*).*/;
    const match = url.match(regex);
    return (match && match[1].length === 11) ? match[1] : null;
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
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
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
                  <h1 className="text-4xl font-bold">Add New Course</h1>
                  <p className="text-indigo-100 text-lg mt-2">Create a new course for your students</p>
                </div>
              </div>
              <div className="hidden md:block">
                <svg className="w-24 h-24 text-white/20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-medium">Error: {error}</p>
            </div>
          </div>
        )}

        {/* Course Form */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 rounded-lg p-2">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Course Details</h2>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="courseActiveDetails"
                  checked={courseForm.isActive}
                  onChange={(e) => setCourseForm({ ...courseForm, isActive: e.target.checked })}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="courseActiveDetails" className="ml-2 block text-sm font-medium text-gray-700">
                  Active course
                </label>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subtopic</label>
                <select
                  value={courseForm.subtopicId}
                  onChange={(e) => setCourseForm({ ...courseForm, subtopicId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Select a subtopic</option>
                  {topics.map((topic) => (
                    <optgroup key={topic.id} label={topic.title}>
                      {(topic.subtopics || []).map((subtopic) => (
                        <option key={subtopic.id} value={subtopic.id}>
                          {subtopic.title}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter course title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">YouTube URL (optional)</label>
                <input
                  type="url"
                  value={courseForm.youtubeUrl}
                  onChange={(e) => setCourseForm({ ...courseForm, youtubeUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter YouTube video URL"
                />
                
                {/* YouTube Video Preview */}
                {courseForm.youtubeUrl && (
                  <div className="mt-4">
                    <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                      <div className="aspect-video">
                        {(() => {
                          const videoId = getYoutubeVideoId(courseForm.youtubeUrl);
                          return videoId ? (
                            <iframe
                              src={`https://www.youtube.com/embed/${videoId}`}
                              title="YouTube video preview"
                              className="w-full h-full"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-red-50">
                              <div className="text-center">
                                <svg className="w-12 h-12 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <p className="text-red-600 text-sm font-medium">Invalid YouTube URL</p>
                                <p className="text-red-500 text-xs mt-1">Please enter a valid YouTube video URL</p>
                              </div>
                            </div>
                          );
                        })()
                        }
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                <textarea
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter course description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent">
                  <Editor
                    value={courseForm.content}
                    onTextChange={(e) => setCourseForm({ ...courseForm, content: e.htmlValue || '' })}
                    style={{ height: '320px' }}
                    placeholder="Enter course content..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => router.back()}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handlePreview}
                disabled={!courseForm.title.trim() && !courseForm.content.trim()}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl"
                title="Preview how your course will look to students"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>Preview</span>
              </button>
              <button
                onClick={handleAddCourse}
                disabled={isSubmitting || !courseForm.title.trim() || !courseForm.content.trim() || !courseForm.subtopicId}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                {isSubmitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>{isSubmitting ? 'Creating Course...' : 'Create Course'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

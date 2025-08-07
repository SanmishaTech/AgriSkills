'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Editor } from 'primereact/editor';

interface Chapter {
  id: string;
  title: string;
  description: string | null;
  content: string;
  youtubeUrl?: string | null;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  courseId: string;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail?: string | null;
  duration?: number | null;
  level?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subtopicId: string;
  chapters: Chapter[];
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export default function CourseChaptersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  
  // Form state
  const [chapterForm, setChapterForm] = useState({
    title: '',
    description: '',
    content: '',
    youtubeUrl: '',
    orderIndex: 0,
    isActive: true
  });

  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const courseId = params.id as string;
  const courseTitle = searchParams.get('title') || 'Course';
  const topicId = searchParams.get('topicId');

  const fetchCourse = useCallback(async (token: string) => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch course');
      }

      const data = await response.json();
      setCourse(data.course);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'admin') {
        router.push('/dashboard');
      } else {
        setUser(parsedUser);
        fetchCourse(token);
      }
    } else {
      router.push('/login');
    }
  }, [router, fetchCourse]);

  const handleAddChapter = async () => {
    if (!chapterForm.title.trim() || !chapterForm.content.trim()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/chapters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...chapterForm,
          courseId: courseId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create chapter');
      }

      const data = await response.json();
      setCourse(prev => prev ? {
        ...prev,
        chapters: [data.chapter, ...prev.chapters]
      } : null);
      
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditChapter = async () => {
    if (!chapterForm.title.trim() || !chapterForm.content.trim() || !selectedChapter) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/chapters/${selectedChapter.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(chapterForm),
      });

      if (!response.ok) {
        throw new Error('Failed to update chapter');
      }

      const data = await response.json();
      setCourse(prev => prev ? {
        ...prev,
        chapters: prev.chapters.map(chapter => 
          chapter.id === selectedChapter.id ? data.chapter : chapter
        )
      } : null);
      
      setShowEditModal(false);
      setSelectedChapter(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteChapter = async () => {
    if (!selectedChapter) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/chapters/${selectedChapter.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete chapter');
      }

      setCourse(prev => prev ? {
        ...prev,
        chapters: prev.chapters.filter(chapter => chapter.id !== selectedChapter.id)
      } : null);
      
      setShowDeleteModal(false);
      setSelectedChapter(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setChapterForm({
      title: chapter.title,
      description: chapter.description || '',
      content: chapter.content,
      youtubeUrl: chapter.youtubeUrl || '',
      orderIndex: chapter.orderIndex,
      isActive: chapter.isActive
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setChapterForm({
      title: '',
      description: '',
      content: '',
      youtubeUrl: '',
      orderIndex: 0,
      isActive: true
    });
  };

  const getYoutubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const regex = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regex);
    return (match && match[1].length === 11) ? match[1] : null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleGoBack = () => {
    if (topicId) {
      router.push(`/dashboard/admin/topics/${topicId}`);
    } else {
      router.back();
    }
  };

  const handlePreviewChapter = (chapter: Chapter) => {
    // Create URL parameters for chapter preview
    const params = new URLSearchParams({
      title: chapter.title,
      description: chapter.description || '',
      content: chapter.content,
      youtubeUrl: chapter.youtubeUrl || '',
      orderIndex: chapter.orderIndex.toString(),
      isActive: chapter.isActive.toString(),
      courseTitle: course?.title || 'Course',
      chapterIndex: (course?.chapters.findIndex(c => c.id === chapter.id) + 1).toString()
    });

    // Open preview in new tab
    window.open(`/dashboard/admin/chapters/preview?${params.toString()}`, '_blank');
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
            <p className="text-gray-500">Loading course chapters...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-medium">Error: {error || 'Course not found'}</p>
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
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleGoBack}
                  className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-4xl font-bold mb-2">Course Chapters</h1>
                  <p className="text-indigo-100 text-lg">{course.title}</p>
                </div>
              </div>
              <div className="hidden md:block">
                <svg className="w-24 h-24 text-white/20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
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

        {/* Course Info */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 rounded-lg p-2">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Course Information</h2>
                  <p className="text-sm text-gray-600 mt-1">Manage chapters for this course</p>
                </div>
              </div>
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                {course.chapters.length} {course.chapters.length === 1 ? 'chapter' : 'chapters'}
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h3>
                {course.description && (
                  <p className="text-gray-600 mb-4">{course.description}</p>
                )}
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    course.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {course.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {course.level && (
                    <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                      {course.level}
                    </span>
                  )}
                  {course.duration && (
                    <span className="text-sm text-gray-500">
                      {course.duration} hours
                    </span>
                  )}
                </div>
              </div>
              {course.thumbnail && (
                <div>
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chapters Management */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-100 rounded-lg p-2">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Chapters</h2>
                  <p className="text-sm text-gray-600 mt-1">Manage course chapters and content</p>
                </div>
                <span className="hidden sm:inline-flex bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                  {course.chapters.length} total
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Chapter</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {course.chapters.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-gray-400 mb-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 font-medium">No chapters found</p>
                <p className="text-gray-400 text-sm mt-1">Get started by creating your first chapter</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {course.chapters.sort((a, b) => a.orderIndex - b.orderIndex).map((chapter, index) => (
                  <div key={chapter.id} className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-bold">
                              Chapter {index + 1}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              chapter.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {chapter.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{chapter.title}</h3>
                          {chapter.description && (
                            <p className="text-gray-600 text-sm mb-3">{chapter.description}</p>
                          )}
                          
                          {/* YouTube Video Preview */}
                          {chapter.youtubeUrl && (
                            <div className="mb-4">
                              <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                <div className="aspect-video">
                                  {(() => {
                                    const videoId = getYoutubeVideoId(chapter.youtubeUrl);
                                    return videoId ? (
                                      <iframe
                                        src={`https://www.youtube.com/embed/${videoId}`}
                                        title={`${chapter.title} - Video`}
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
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Content Preview */}
                          {chapter.content && (
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Content Preview</h4>
                              <div 
                                className="prose prose-sm max-w-none text-gray-600 line-clamp-3"
                                dangerouslySetInnerHTML={{ __html: chapter.content }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span>Created {formatDate(chapter.createdAt)}</span>
                        <span>Order: {chapter.orderIndex}</span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(chapter)}
                          className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handlePreviewChapter(chapter)}
                          className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>Preview</span>
                        </button>
                        <button
                          onClick={() => openDeleteModal(chapter)}
                          className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center space-x-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Chapter Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Add New Chapter</h3>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="chapterActiveAdd"
                    checked={chapterForm.isActive}
                    onChange={(e) => setChapterForm({ ...chapterForm, isActive: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="chapterActiveAdd" className="ml-2 block text-sm text-gray-700">
                    Active chapter
                  </label>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={chapterForm.title}
                      onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter chapter title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order Index</label>
                    <input
                      type="number"
                      min="0"
                      value={chapterForm.orderIndex}
                      onChange={(e) => setChapterForm({ ...chapterForm, orderIndex: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                  <textarea
                    value={chapterForm.description}
                    onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter chapter description"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">YouTube URL (optional)</label>
                  <input
                    type="url"
                    value={chapterForm.youtubeUrl}
                    onChange={(e) => setChapterForm({ ...chapterForm, youtubeUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter YouTube video URL"
                  />
                  {chapterForm.youtubeUrl && (
                    <div className="mt-2">
                      <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                        <div className="aspect-video">
                          {(() => {
                            const videoId = getYoutubeVideoId(chapterForm.youtubeUrl);
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
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
                    <Editor
                      value={chapterForm.content}
                      onTextChange={(e) => setChapterForm({ ...chapterForm, content: e.htmlValue || '' })}
                      style={{ height: '320px' }}
                      placeholder="Enter chapter content..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddChapter}
                  disabled={isSubmitting || !chapterForm.title.trim() || !chapterForm.content.trim()}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>{isSubmitting ? 'Creating...' : 'Create Chapter'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Chapter Modal */}
        {showEditModal && selectedChapter && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Edit Chapter</h3>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="chapterActiveEdit"
                    checked={chapterForm.isActive}
                    onChange={(e) => setChapterForm({ ...chapterForm, isActive: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="chapterActiveEdit" className="ml-2 block text-sm text-gray-700">
                    Active chapter
                  </label>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={chapterForm.title}
                      onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter chapter title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order Index</label>
                    <input
                      type="number"
                      min="0"
                      value={chapterForm.orderIndex}
                      onChange={(e) => setChapterForm({ ...chapterForm, orderIndex: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                  <textarea
                    value={chapterForm.description}
                    onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter chapter description"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">YouTube URL (optional)</label>
                  <input
                    type="url"
                    value={chapterForm.youtubeUrl}
                    onChange={(e) => setChapterForm({ ...chapterForm, youtubeUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter YouTube video URL"
                  />
                  {chapterForm.youtubeUrl && (
                    <div className="mt-2">
                      <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                        <div className="aspect-video">
                          {(() => {
                            const videoId = getYoutubeVideoId(chapterForm.youtubeUrl);
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
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
                    <Editor
                      value={chapterForm.content}
                      onTextChange={(e) => setChapterForm({ ...chapterForm, content: e.htmlValue || '' })}
                      style={{ height: '320px' }}
                      placeholder="Enter chapter content..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedChapter(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditChapter}
                  disabled={isSubmitting || !chapterForm.title.trim() || !chapterForm.content.trim()}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>{isSubmitting ? 'Updating...' : 'Update Chapter'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Chapter Modal */}
        {showDeleteModal && selectedChapter && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Chapter</h3>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete the chapter &ldquo;{selectedChapter.title}&rdquo;? This action cannot be undone.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">
                    <strong>Warning:</strong> All chapter data will be permanently removed.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedChapter(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteChapter}
                  disabled={isSubmitting}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>{isSubmitting ? 'Deleting...' : 'Delete Chapter'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

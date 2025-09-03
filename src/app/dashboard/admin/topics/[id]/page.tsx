'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';

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
  demoVideos?: DemoVideo[];
  sections?: Section[];
}

interface DemoVideo {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  duration: number | null;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Section {
  id: string;
  title: string;
  content: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
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
  _count?: {
    chapters: number;
  };
}

interface Subtopic {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  topicId: string;
  courses: Course[];
  _count?: {
    courses: number;
  };
}

interface Topic {
  id: string;
  title: string;
  description: string | null;
  thumbnail?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subtopics?: Subtopic[];
  _count?: {
    subtopics: number;
  };
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminTopicDetail() {
  const [user, setUser] = useState<User | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    thumbnail: '',
    isActive: true
  });
  const [showAddSubtopicModal, setShowAddSubtopicModal] = useState(false);
  const [showEditSubtopicModal, setShowEditSubtopicModal] = useState(false);
  const [showDeleteSubtopicModal, setShowDeleteSubtopicModal] = useState(false);
  const [selectedSubtopic, setSelectedSubtopic] = useState<Subtopic | null>(null);
  const [subtopicForm, setSubtopicForm] = useState({
    title: '',
    description: '',
    isActive: true
  });
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [showDeleteCourseModal, setShowDeleteCourseModal] = useState(false);
  const [showCourseChaptersModal, setShowCourseChaptersModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [chapterToEdit, setChapterToEdit] = useState<Chapter | null>(null);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    thumbnail: '',
    duration: 0,
    level: 'BEGINNER' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
    isActive: true,
    subtopicId: ''
  });
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [showEditChapterModal, setShowEditChapterModal] = useState(false);
  const [showDeleteChapterModal, setShowDeleteChapterModal] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [chapterForm, setChapterForm] = useState({
    title: '',
    content: '',
    youtubeUrl: '',
    orderIndex: 0,
    isActive: true,
    courseId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingCourseThumbnail, setUploadingCourseThumbnail] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Subtopic expansion state for accordion
  const [expandedSubtopics, setExpandedSubtopics] = useState<Set<string>>(new Set());

  const router = useRouter();
  const params = useParams();
  const topicId = params.id as string;

  const fetchTopic = useCallback(async (token: string) => {
    try {
      const response = await fetch(`/api/admin/topics/${topicId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch topic');
      }

      const data = await response.json();
      setTopic(data.topic);
      setEditForm({
        title: data.topic.title,
        description: data.topic.description || '',
        thumbnail: data.topic.thumbnail || '',
        isActive: data.topic.isActive
      });
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
        fetchTopic(token);
      }
    } else {
      router.push('/login');
    }
  }, [router, topicId, fetchTopic]);

  const handleEditTopic = async () => {
    if (!editForm.title.trim()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/topics/${topicId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description || null,
          thumbnail: editForm.thumbnail || null,
          isActive: editForm.isActive
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update topic');
      }

      const data = await response.json();
      setTopic(data.topic);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploadingThumbnail(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload thumbnail');
      }

      const data = await response.json();
      setEditForm({ ...editForm, thumbnail: data.url });
    } catch (err) {
      alert('Failed to upload thumbnail. Please try again.');
      console.error(err);
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleCourseThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploadingCourseThumbnail(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload thumbnail');
      }

      const data = await response.json();
      setCourseForm({ ...courseForm, thumbnail: data.url });
    } catch (err) {
      alert('Failed to upload thumbnail. Please try again.');
      console.error(err);
    } finally {
      setUploadingCourseThumbnail(false);
    }
  };

  const handleAddSubtopic = async () => {
    if (!subtopicForm.title.trim()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/subtopics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ...subtopicForm, topicId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subtopic');
      }

      const data = await response.json();
      setTopic(prev => prev ? {
        ...prev,
        subtopics: [data.subtopic, ...(prev.subtopics || [])]
      } : null);
      setShowAddSubtopicModal(false);
      setSubtopicForm({
        title: '',
        description: '',
        isActive: true
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubtopic = async () => {
    if (!subtopicForm.title.trim() || !selectedSubtopic) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/subtopics/${selectedSubtopic.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: subtopicForm.title,
          description: subtopicForm.description || null,
          isActive: subtopicForm.isActive
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update subtopic');
      }

      const data = await response.json();
      // Update the subtopic in the topic's subtopics array
      setTopic(prev => prev ? {
        ...prev,
        subtopics: (prev.subtopics || []).map(subtopic =>
          subtopic.id === selectedSubtopic.id ? data.subtopic : subtopic
        )
      } : null);
      setShowEditSubtopicModal(false);
      setSelectedSubtopic(null);
      setSubtopicForm({
        title: '',
        description: '',
        isActive: true
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubtopic = async () => {
    if (!selectedSubtopic) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/subtopics/${selectedSubtopic.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete subtopic');
      }

      // Remove the subtopic from the topic's subtopics array
      setTopic(prev => prev ? {
        ...prev,
        subtopics: (prev.subtopics || []).filter(subtopic => subtopic.id !== selectedSubtopic.id)
      } : null);
      setShowDeleteSubtopicModal(false);
      setSelectedSubtopic(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditSubtopicModal = (subtopic: Subtopic) => {
    setSelectedSubtopic(subtopic);
    setSubtopicForm({
      title: subtopic.title,
      description: subtopic.description || '',
      isActive: subtopic.isActive
    });
    setShowEditSubtopicModal(true);
  };

  const openDeleteSubtopicModal = (subtopic: Subtopic) => {
    setSelectedSubtopic(subtopic);
    setShowDeleteSubtopicModal(true);
  };

  const handleAddCourse = async () => {
    if (!courseForm.title.trim() || !courseForm.subtopicId) return;

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

      const data = await response.json();
      // Update the subtopic's courses array
      setTopic(prev => prev ? {
        ...prev,
        subtopics: (prev.subtopics || []).map(subtopic =>
          subtopic.id === courseForm.subtopicId
            ? { ...subtopic, courses: [data.course, ...(subtopic.courses || [])] }
            : subtopic
        )
      } : null);
      setShowAddCourseModal(false);
      setCourseForm({
        title: '',
        description: '',
        thumbnail: '',
        duration: 0,
        level: 'BEGINNER' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
        isActive: true,
        subtopicId: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddChapter = async () => {
    if (!chapterForm.title.trim() || !chapterForm.courseId) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/chapters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(chapterForm),
      });

      if (!response.ok) {
        throw new Error('Failed to create chapter');
      }

      const data = await response.json();
      // Update the course's chapters array
      setTopic(prev => prev ? {
        ...prev,
        subtopics: (prev.subtopics || []).map(subtopic => ({
          ...subtopic,
          courses: (subtopic.courses || []).map(course =>
            course.id === chapterForm.courseId
              ? { ...course, chapters: [data.chapter, ...(course.chapters || [])] }
              : course
          )
        }))
      } : null);
      setShowAddChapterModal(false);
      setChapterForm({
        title: '',
        content: '',
        youtubeUrl: '',
        orderIndex: 0,
        isActive: true,
        courseId: ''
      });
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
      // Update the course's chapters array
      setTopic(prev => prev ? {
        ...prev,
        subtopics: (prev.subtopics || []).map(subtopic => ({
          ...subtopic,
          courses: (subtopic.courses || []).map(course =>
            course.id === selectedChapter.courseId
              ? {
                ...course, chapters: (course.chapters || []).map(chapter =>
                  chapter.id === selectedChapter.id ? data.chapter : chapter
                )
              }
              : course
          )
        }))
      } : null);
      setShowEditChapterModal(false);
      setSelectedChapter(null);
      setChapterForm({
        title: '',
        content: '',
        youtubeUrl: '',
        orderIndex: 0,
        isActive: true,
        courseId: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getYoutubeVideoId = (url: string): string | null => {
    const regex = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|shorts\/|\&v=)([^#\&\?]*).*/;
    const match = url.match(regex);
    return (match && match[1].length === 11) ? match[1] : null;
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

      // Update the course's chapters array
      setTopic(prev => prev ? {
        ...prev,
        subtopics: (prev.subtopics || []).map(subtopic => ({
          ...subtopic,
          courses: (subtopic.courses || []).map(course =>
            course.id === selectedChapter.courseId
              ? { ...course, chapters: (course.chapters || []).filter(chapter => chapter.id !== selectedChapter.id) }
              : course
          )
        }))
      } : null);
      setShowDeleteChapterModal(false);
      setSelectedChapter(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditChapterModal = (chapter: Chapter) => {
    setChapterToEdit(chapter);
    setChapterForm({
      title: chapter.title,
      content: chapter.content,
      youtubeUrl: chapter.youtubeUrl || '',
      orderIndex: chapter.orderIndex,
      isActive: chapter.isActive,
      courseId: chapter.courseId
    });
    setShowEditChapterModal(true);
  };

  const openEditCourseModal = (course: Course) => {
    setCourseToEdit(course);
    setCourseForm({
      title: course.title,
      description: course.description || '',
      thumbnail: course.thumbnail || '',
      duration: course.duration || 0,
      level: (course.level || 'BEGINNER') as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
      isActive: course.isActive,
      subtopicId: course.subtopicId
    });
    setShowEditCourseModal(true);
  };

  const openDeleteCourseModal = (course: Course) => {
    setCourseToDelete(course);
    setShowDeleteCourseModal(true);
  };

  const handleEditCourse = async () => {
    if (!courseForm.title.trim() || !courseToEdit) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/courses/${courseToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(courseForm),
      });

      if (!response.ok) {
        throw new Error('Failed to update course');
      }

      const data = await response.json();
      // Update the course in the subtopic's courses array
      setTopic(prev => prev ? {
        ...prev,
        subtopics: (prev.subtopics || []).map(subtopic => ({
          ...subtopic,
          courses: (subtopic.courses || []).map(course =>
            course.id === courseToEdit.id ? data.course : course
          )
        }))
      } : null);
      setShowEditCourseModal(false);
      setCourseToEdit(null);
      setCourseForm({
        title: '',
        description: '',
        thumbnail: '',
        duration: 0,
        level: 'BEGINNER' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
        isActive: true,
        subtopicId: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/courses/${courseToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete course');
      }

      // Remove the course from the subtopic's courses array
      setTopic(prev => prev ? {
        ...prev,
        subtopics: (prev.subtopics || []).map(subtopic => ({
          ...subtopic,
          courses: (subtopic.courses || []).filter(course => course.id !== courseToDelete.id)
        }))
      } : null);
      setShowDeleteCourseModal(false);
      setCourseToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle accordion state
  const toggleSubtopic = (subtopicId: string) => {
    setExpandedSubtopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subtopicId)) {
        newSet.delete(subtopicId);
      } else {
        newSet.add(subtopicId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateContent = (content: string | null | undefined, maxLength: number = 100) => {
    if (!content) return 'No content available';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
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
            <p className="text-gray-500">Loading topic details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-medium">Error: {error || 'Topic not found'}</p>
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
                  onClick={() => router.push('/dashboard/admin/topics')}
                  className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-4xl font-bold mb-2">Topic Details</h1>
                  <p className="text-indigo-100 text-lg">Manage topic information and courses</p>
                </div>
              </div>
              <div className="hidden md:block">
                <svg className="w-24 h-24 text-white/20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Topic Information */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-100 rounded-lg p-2">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Topic Information</h2>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>{isEditing ? 'Cancel Edit' : 'Edit Topic'}</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter topic title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter topic description"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail (optional)</label>
                  <div className="space-y-2">
                    {editForm.thumbnail && (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={editForm.thumbnail}
                          alt="Topic thumbnail"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, thumbnail: '' })}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleThumbnailUpload}
                      disabled={uploadingThumbnail}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {uploadingThumbnail && (
                      <div className="flex items-center justify-center py-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                        <span className="ml-2 text-sm text-gray-600">Uploading...</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Active topic
                  </label>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditTopic}
                    disabled={isSubmitting || !editForm.title.trim()}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isSubmitting && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    <span>{isSubmitting ? 'Updating...' : 'Update Topic'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{topic.title}</h3>
                  <div className="flex items-center space-x-4 mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${topic.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                      {topic.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-gray-500 text-sm">
                      Created {formatDate(topic.createdAt)}
                    </span>
                  </div>
                </div>

                {topic.thumbnail && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Thumbnail</h4>
                    <img
                      src={topic.thumbnail}
                      alt={`${topic.title} thumbnail`}
                      className="w-48 h-32 object-cover rounded-lg border border-gray-200 shadow-sm"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {topic.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                    <p className="text-gray-600">{topic.description}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Demo Management */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div
            className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200 cursor-pointer hover:from-blue-100 hover:to-blue-150 transition-colors"
            onClick={() => router.push(`/dashboard/admin/topics/${topicId}/demo`)}
          >
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 rounded-lg p-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Demo Videos & Content</h2>
                <p className="text-sm text-gray-600 mt-1">Manage demo videos and topic description content</p>
              </div>
              <div className="ml-auto">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Questions Management */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div
            className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200 cursor-pointer hover:from-purple-100 hover:to-pink-100 transition-colors"
            onClick={() => router.push(`/dashboard/admin/topics/${topicId}/questions`)}
          >
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 rounded-lg p-2">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Questions</h2>
                <p className="text-sm text-gray-600 mt-1">Manage questions that users can select for this topic</p>
              </div>
              <div className="ml-auto">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>


        {/* Subtopics Management */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-5 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 rounded-xl p-3 shadow-sm">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-bold text-gray-900">Subtopics</h2>
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold border border-purple-200 shadow-sm">
                    {(topic.subtopics || []).length} {(topic.subtopics || []).length === 1 ? 'subtopic' : 'subtopics'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Manage subtopics and their courses</p>
              </div>
            </div>

            {/* Add Subtopic Button and Search */}
            <div className="mt-4 space-y-3">
              <button
                onClick={() => setShowAddSubtopicModal(true)}
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-full h-11 px-6 text-sm font-semibold ring-1 ring-white/20 shadow-md hover:shadow-lg hover:from-violet-700 hover:to-fuchsia-700 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Subtopic</span>
              </button>

              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                  placeholder="Search subtopics by title or description..."
                />
                {searchQuery && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            {(() => {
              // Filter subtopics based on search query
              const filteredSubtopics = (topic.subtopics || []).filter(subtopic => {
                if (!searchQuery) return true;
                const query = searchQuery.toLowerCase();
                return (
                  subtopic.title.toLowerCase().includes(query) ||
                  (subtopic.description && subtopic.description.toLowerCase().includes(query))
                );
              });

              // Show no results message if search returns empty
              if (searchQuery && filteredSubtopics.length === 0) {
                return (
                  <div className="text-center py-12">
                    <svg className="w-12 h-12 text-gray-400 mb-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-gray-500 font-medium">No subtopics found</p>
                    <p className="text-gray-400 text-sm mt-1">Try adjusting your search terms</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-3 text-violet-600 hover:text-violet-700 text-sm font-medium"
                    >
                      Clear search
                    </button>
                  </div>
                );
              }

              // Show original no subtopics message if no subtopics exist
              if (filteredSubtopics.length === 0) {
                return (
                  <div className="text-center py-12">
                    <svg className="w-12 h-12 text-gray-400 mb-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-gray-500 font-medium">No subtopics found</p>
                    <p className="text-gray-400 text-sm mt-1">Get started by creating your first subtopic</p>
                  </div>
                );
              }

              return (
                <div className="space-y-8">
                  {filteredSubtopics.map((subtopic) => (
                    <div key={subtopic.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* Subtopic Header */}
                      <div
                        className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200 cursor-pointer hover:from-indigo-100 hover:to-purple-100 transition-colors"
                        onClick={() => toggleSubtopic(subtopic.id)}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="bg-indigo-100 rounded-lg p-2">
                              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-gray-900">{subtopic.title}</h3>
                                <svg
                                  className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${expandedSubtopics.has(subtopic.id) ? 'rotate-90' : ''
                                    }`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                              {subtopic.description && (
                                <p className="text-sm text-gray-600 mt-1">{subtopic.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:justify-end">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium ${subtopic.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                              }`}>
                              {subtopic.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span className="bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full text-xs sm:text-sm font-semibold">
                              {(subtopic.courses || []).length} {(subtopic.courses || []).length === 1 ? 'course' : 'courses'}
                            </span>
                            <button
                              onClick={() => {
                                setCourseForm({ ...courseForm, subtopicId: subtopic.id });
                                setShowAddCourseModal(true);
                              }}
                              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-full h-9 px-4 text-xs sm:h-10 sm:px-5 sm:text-sm font-semibold ring-1 ring-white/20 shadow-sm hover:from-violet-700 hover:to-fuchsia-700 transition-colors flex items-center justify-center gap-2 shrink-0"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              <span>Add Course</span>
                            </button>
                            <button
                              onClick={() => openEditSubtopicModal(subtopic)}
                              className="bg-indigo-600 text-white rounded-full h-9 px-4 text-xs sm:h-10 sm:px-5 sm:text-sm font-semibold shadow-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shrink-0"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => openDeleteSubtopicModal(subtopic)}
                              className="bg-red-600 text-white rounded-full h-9 px-4 text-xs sm:h-10 sm:px-5 sm:text-sm font-semibold shadow-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shrink-0"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Courses List */}
                      {expandedSubtopics.has(subtopic.id) && (
                        <div className="p-6">
                          {(subtopic.courses || []).length === 0 ? (
                            <div className="text-center py-8">
                              <svg className="w-10 h-10 text-gray-400 mb-3 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                              <p className="text-gray-500 font-medium">No courses in this subtopic</p>
                              <p className="text-gray-400 text-sm mt-1">Add a course to get started</p>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              {(subtopic.courses || []).map((course) => (
                                <div key={course.id} className="relative bg-gray-50 border border-gray-200 rounded-xl p-6">
                                  <span
                                    className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ring-1 ${course.isActive
                                        ? 'bg-green-100 text-green-800 ring-green-200'
                                        : 'bg-red-100 text-red-800 ring-red-200'
                                      }`}
                                  >
                                    {course.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                      <h4 className="text-lg font-semibold text-gray-900 line-clamp-2">{course.title}</h4>
                                      <div className="flex items-center space-x-3 mt-2">
                                        {course.level && (
                                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                                            {course.level}
                                          </span>
                                        )}
                                        {course.duration && (
                                          <span className="text-xs text-gray-500">
                                            {course.duration} hours
                                          </span>
                                        )}
                                        <span className="text-xs text-gray-500">
                                          {(course.chapters || []).length} {(course.chapters || []).length === 1 ? 'chapter' : 'chapters'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {course.description && (
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
                                  )}

                                  {course.thumbnail && (
                                    <div className="mb-4">
                                      <img
                                        src={course.thumbnail}
                                        alt={course.title}
                                        className="w-full h-48 object-cover rounded-lg"
                                      />
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                    <span>Created {formatDate(course.createdAt)}</span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <button
                                      onClick={() => {
                                        router.push(`/dashboard/admin/courses/${course.id}/chapters?title=${encodeURIComponent(course.title)}&topicId=${topicId}`);
                                      }}
                                      className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-full h-10 px-4 text-sm font-semibold ring-1 ring-white/20 shadow-sm hover:from-violet-700 hover:to-fuchsia-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                      </svg>
                                      <span>View Chapters</span>
                                    </button>
                                    <button
                                      onClick={() => openEditCourseModal(course)}
                                      className="w-full bg-indigo-600 text-white rounded-full h-10 px-4 text-sm font-semibold shadow-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      onClick={() => openDeleteCourseModal(course)}
                                      className="w-full bg-red-600 text-white rounded-full h-10 px-4 text-sm font-semibold shadow-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Add Chapter Modal */}
        {showAddChapterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Add New Chapter</h3>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="chapterActiveHeader"
                    checked={chapterForm.isActive}
                    onChange={(e) => setChapterForm({ ...chapterForm, isActive: e.target.checked })}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="chapterActiveHeader" className="ml-2 block text-sm text-gray-700">
                    Active chapter
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                  <select
                    value={chapterForm.courseId}
                    onChange={(e) => setChapterForm({ ...chapterForm, courseId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Select a course</option>
                    {(topic.subtopics || []).flatMap(subtopic =>
                      (subtopic.courses || []).map(course => (
                        <option key={course.id} value={course.id}>
                          {subtopic.title} - {course.title}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={chapterForm.title}
                    onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter chapter title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">YouTube URL (optional)</label>
                  <input
                    type="url"
                    value={chapterForm.youtubeUrl}
                    onChange={(e) => setChapterForm({ ...chapterForm, youtubeUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter YouTube video URL"
                  />
                </div>



                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <textarea
                    value={chapterForm.content}
                    onChange={(e) => setChapterForm({ ...chapterForm, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter chapter content"
                    rows={8}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowAddChapterModal(false);
                    setChapterForm({
                      title: '',
                      content: '',
                      youtubeUrl: '',
                      orderIndex: 0,
                      isActive: true,
                      courseId: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddChapter}
                  disabled={isSubmitting || !chapterForm.title.trim() || !chapterForm.content.trim() || !chapterForm.courseId}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
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
        {showEditChapterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Chapter</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={chapterForm.title}
                    onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter chapter title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">YouTube URL (optional)</label>
                  <input
                    type="url"
                    value={chapterForm.youtubeUrl}
                    onChange={(e) => setChapterForm({ ...chapterForm, youtubeUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter YouTube video URL"
                  />
                </div>



                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <textarea
                    value={chapterForm.content}
                    onChange={(e) => setChapterForm({ ...chapterForm, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter chapter content"
                    rows={8}
                    required
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editChapterActive"
                    checked={chapterForm.isActive}
                    onChange={(e) => setChapterForm({ ...chapterForm, isActive: e.target.checked })}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="editChapterActive" className="ml-2 block text-sm text-gray-700">
                    Active chapter
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowEditChapterModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditChapter}
                  disabled={isSubmitting || !chapterForm.title.trim() || !chapterForm.content.trim()}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
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
        {showDeleteChapterModal && selectedChapter && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
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
                  onClick={() => setShowDeleteChapterModal(false)}
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

        {/* Add Subtopic Modal */}
        {showAddSubtopicModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Subtopic</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={subtopicForm.title}
                    onChange={(e) => setSubtopicForm({ ...subtopicForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter subtopic title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                  <textarea
                    value={subtopicForm.description}
                    onChange={(e) => setSubtopicForm({ ...subtopicForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter subtopic description"
                    rows={3}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="subtopicActive"
                    checked={subtopicForm.isActive}
                    onChange={(e) => setSubtopicForm({ ...subtopicForm, isActive: e.target.checked })}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="subtopicActive" className="ml-2 block text-sm text-gray-700">
                    Active subtopic
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowAddSubtopicModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSubtopic}
                  disabled={isSubmitting || !subtopicForm.title.trim()}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>{isSubmitting ? 'Creating...' : 'Create Subtopic'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Course Modal */}
        {showAddCourseModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Add New Course</h3>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="courseActiveHeader"
                    checked={courseForm.isActive}
                    onChange={(e) => setCourseForm({ ...courseForm, isActive: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="courseActiveHeader" className="ml-2 block text-sm text-gray-700">
                    Active course
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter course title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                  <textarea
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter course description"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail (optional)</label>
                  <div className="space-y-2">
                    {courseForm.thumbnail && (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={courseForm.thumbnail}
                          alt="Course thumbnail"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setCourseForm({ ...courseForm, thumbnail: '' })}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleCourseThumbnailUpload}
                      disabled={uploadingCourseThumbnail}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {uploadingCourseThumbnail && (
                      <div className="flex items-center justify-center py-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                        <span className="ml-2 text-sm text-gray-600">Uploading...</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (hours)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={courseForm.duration}
                      onChange={(e) => setCourseForm({ ...courseForm, duration: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                    <select
                      value={courseForm.level}
                      onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowAddCourseModal(false);
                    setCourseForm({
                      title: '',
                      description: '',
                      thumbnail: '',
                      duration: 0,
                      level: 'BEGINNER' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
                      isActive: true,
                      subtopicId: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCourse}
                  disabled={isSubmitting || !courseForm.title.trim() || !courseForm.subtopicId}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>{isSubmitting ? 'Creating...' : 'Create Course'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Course Modal */}
        {showEditCourseModal && courseToEdit && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Edit Course</h3>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editCourseActiveHeader"
                    checked={courseForm.isActive}
                    onChange={(e) => setCourseForm({ ...courseForm, isActive: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="editCourseActiveHeader" className="ml-2 block text-sm text-gray-700">
                    Active course
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter course title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                  <textarea
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter course description"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail (optional)</label>
                  <div className="space-y-2">
                    {courseForm.thumbnail && (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={courseForm.thumbnail}
                          alt="Course thumbnail"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setCourseForm({ ...courseForm, thumbnail: '' })}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleCourseThumbnailUpload}
                      disabled={uploadingCourseThumbnail}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {uploadingCourseThumbnail && (
                      <div className="flex items-center justify-center py-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                        <span className="ml-2 text-sm text-gray-600">Uploading...</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (hours)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={courseForm.duration}
                      onChange={(e) => setCourseForm({ ...courseForm, duration: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                    <select
                      value={courseForm.level}
                      onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowEditCourseModal(false);
                    setCourseToEdit(null);
                    setCourseForm({
                      title: '',
                      description: '',
                      thumbnail: '',
                      duration: 0,
                      level: 'BEGINNER' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
                      isActive: true,
                      subtopicId: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditCourse}
                  disabled={isSubmitting || !courseForm.title.trim()}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>{isSubmitting ? 'Updating...' : 'Update Course'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Course Modal */}
        {showDeleteCourseModal && courseToDelete && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Course</h3>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete the course &ldquo;{courseToDelete.title}&rdquo;? This action cannot be undone.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">
                    <strong>Warning:</strong> All course data and associated chapters will be permanently removed.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteCourseModal(false);
                    setCourseToDelete(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCourse}
                  disabled={isSubmitting}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>{isSubmitting ? 'Deleting...' : 'Delete Course'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Subtopic Modal */}
        {showEditSubtopicModal && selectedSubtopic && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Subtopic</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={subtopicForm.title}
                    onChange={(e) => setSubtopicForm({ ...subtopicForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter subtopic title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                  <textarea
                    value={subtopicForm.description}
                    onChange={(e) => setSubtopicForm({ ...subtopicForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter subtopic description"
                    rows={3}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editSubtopicActive"
                    checked={subtopicForm.isActive}
                    onChange={(e) => setSubtopicForm({ ...subtopicForm, isActive: e.target.checked })}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="editSubtopicActive" className="ml-2 block text-sm text-gray-700">
                    Active subtopic
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowEditSubtopicModal(false);
                    setSelectedSubtopic(null);
                    setSubtopicForm({
                      title: '',
                      description: '',
                      isActive: true
                    });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubtopic}
                  disabled={isSubmitting || !subtopicForm.title.trim()}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>{isSubmitting ? 'Updating...' : 'Update Subtopic'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Subtopic Modal */}
        {showDeleteSubtopicModal && selectedSubtopic && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Subtopic</h3>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete the subtopic &ldquo;{selectedSubtopic.title}&rdquo;? This action cannot be undone.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">
                    <strong>Warning:</strong> All subtopic data and associated courses will be permanently removed.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteSubtopicModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSubtopic}
                  disabled={isSubmitting}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>{isSubmitting ? 'Deleting...' : 'Delete Subtopic'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';

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

interface TopicQuestion {
  id: string;
  topicId: string;
  question: string;
  isActive: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminTopicQuestions() {
  const [user, setUser] = useState<User | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [questions, setQuestions] = useState<TopicQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<TopicQuestion | null>(null);
  
  // Form state
  const [questionForm, setQuestionForm] = useState({
    question: '',
    isActive: true
  });
  
  const router = useRouter();
  const params = useParams();
  const topicId = params.id as string;

  const fetchTopicAndQuestions = useCallback(async (token: string) => {
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

      // Fetch questions
      const questionsResponse = await fetch(`/api/admin/topics/${topicId}/questions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (questionsResponse.ok) {
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData.questions || []);
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
        fetchTopicAndQuestions(token);
      }
    } else {
      router.push('/login');
    }
  }, [router, fetchTopicAndQuestions]);

  const handleAddQuestion = async () => {
    if (!questionForm.question.trim()) return;

    setSaving(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/topics/${topicId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(questionForm),
      });

      if (!response.ok) {
        throw new Error('Failed to add question');
      }

      const data = await response.json();
      setQuestions([...questions, data.question]);
      setShowAddModal(false);
      setQuestionForm({ question: '', isActive: true });
      setSuccess('Question added successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while adding question');
    } finally {
      setSaving(false);
    }
  };

  const handleEditQuestion = async () => {
    if (!questionForm.question.trim() || !selectedQuestion) return;

    setSaving(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/questions/${selectedQuestion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(questionForm),
      });

      if (!response.ok) {
        throw new Error('Failed to update question');
      }

      const data = await response.json();
      setQuestions(questions.map(q => q.id === selectedQuestion.id ? data.question : q));
      setShowEditModal(false);
      setSelectedQuestion(null);
      setQuestionForm({ question: '', isActive: true });
      setSuccess('Question updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating question');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!selectedQuestion) return;

    setSaving(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/questions/${selectedQuestion.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete question');
      }

      setQuestions(questions.filter(q => q.id !== selectedQuestion.id));
      setShowDeleteModal(false);
      setSelectedQuestion(null);
      setSuccess('Question deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while deleting question');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (question: TopicQuestion) => {
    setSelectedQuestion(question);
    setQuestionForm({
      question: question.question,
      isActive: question.isActive
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (question: TopicQuestion) => {
    setSelectedQuestion(question);
    setShowDeleteModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
            <p className="text-gray-500">Loading questions...</p>
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
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
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
                  <h1 className="text-4xl font-bold mb-2">Topic Questions</h1>
                  <p className="text-purple-100 text-lg">{topic?.title}</p>
                </div>
              </div>
              <div className="hidden md:block">
                <svg className="w-24 h-24 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

        {/* Questions Management */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 rounded-lg p-2">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">All Questions</h2>
                  <p className="text-sm text-gray-600 mt-1">Manage questions that users can select for this topic</p>
                </div>
                <span className="hidden sm:inline-flex bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                  {questions.length} total
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Question</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {questions.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-gray-400 mb-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 font-medium">No questions found</p>
                <p className="text-gray-400 text-sm mt-1">Get started by creating your first question</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="bg-purple-100 rounded-full p-1 mt-1">
                          <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="4"/>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium mb-1">{question.question}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              question.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {question.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span>Order: {question.orderIndex}</span>
                            <span>Created {formatDate(question.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => openEditModal(question)}
                          className="text-indigo-600 hover:text-indigo-700 p-2 rounded-full hover:bg-indigo-50 transition-colors"
                          title="Edit question"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openDeleteModal(question)}
                          className="text-red-600 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                          title="Delete question"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Question Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Add New Question</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                  <textarea
                    value={questionForm.question}
                    onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter your question..."
                    rows={3}
                    required
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActiveAdd"
                    checked={questionForm.isActive}
                    onChange={(e) => setQuestionForm({ ...questionForm, isActive: e.target.checked })}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActiveAdd" className="ml-2 block text-sm text-gray-700">
                    Active question
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddQuestion}
                  disabled={saving || !questionForm.question.trim()}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {saving && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>{saving ? 'Adding...' : 'Add Question'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Question Modal */}
        {showEditModal && selectedQuestion && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Edit Question</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                  <textarea
                    value={questionForm.question}
                    onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter your question..."
                    rows={3}
                    required
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActiveEdit"
                    checked={questionForm.isActive}
                    onChange={(e) => setQuestionForm({ ...questionForm, isActive: e.target.checked })}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActiveEdit" className="ml-2 block text-sm text-gray-700">
                    Active question
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditQuestion}
                  disabled={saving || !questionForm.question.trim()}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {saving && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>{saving ? 'Updating...' : 'Update Question'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Question Modal */}
        {showDeleteModal && selectedQuestion && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Question</h3>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete this question? This action cannot be undone.
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-gray-800 text-sm font-medium">
                    "{selectedQuestion.question}"
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedQuestion(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteQuestion}
                  disabled={saving}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {saving && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>{saving ? 'Deleting...' : 'Delete Question'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

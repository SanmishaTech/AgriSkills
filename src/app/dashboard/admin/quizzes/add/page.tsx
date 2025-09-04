'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  X, 
  Check,
  Clock,
  HelpCircle,
  BookOpen,
  AlertCircle,
  Trash2
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Topic {
  id: string;
  title: string;
}

interface Subtopic {
  id: string;
  title: string;
  topic: Topic;
}

interface Course {
  id: string;
  title: string;
  subtopic: Subtopic;
}

interface Chapter {
  id: string;
  title: string;
  course: Course;
}

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'fill_in_blank';
  points: number;
  answers: Answer[];
}

export default function AddQuizPage() {
  const [user, setUser] = useState<User | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Quiz form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    chapterId: '',
    passingScore: 70,
    timeLimit: 30,
    hasTimeLimit: false,
    isActive: true
  });

  const [questions, setQuestions] = useState<Question[]>([]);

  const router = useRouter();

  // Helper to clamp numbers within a range
  const clamp = (value: number, min: number, max: number) => {
    if (Number.isNaN(value)) return min;
    return Math.min(max, Math.max(min, value));
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'admin') {
        router.push('/dashboard');
      } else {
        setUser(parsedUser);
        fetchChapters(token);
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchChapters = async (token: string) => {
    try {
      setLoading(true);
      
      // First get all courses to get chapters from
      const coursesResponse = await fetch('/api/admin/courses', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!coursesResponse.ok) {
        throw new Error('Failed to fetch courses');
      }

      const coursesData = await coursesResponse.json();
      const allChapters: Chapter[] = [];

      // Get chapters for each course
      for (const course of coursesData.courses) {
        const chaptersResponse = await fetch(`/api/admin/chapters?courseId=${course.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (chaptersResponse.ok) {
          const chaptersData = await chaptersResponse.json();
          allChapters.push(...chaptersData.chapters);
        }
      }

      setChapters(allChapters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      text: '',
      type: 'multiple_choice',
      points: 1,
      answers: [
        { id: Math.random().toString(36).substr(2, 9), text: '', isCorrect: true },
        { id: Math.random().toString(36).substr(2, 9), text: '', isCorrect: false },
        { id: Math.random().toString(36).substr(2, 9), text: '', isCorrect: false },
        { id: Math.random().toString(36).substr(2, 9), text: '', isCorrect: false }
      ]
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const updateQuestion = (questionId: string, field: string, value: any) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    ));
  };

  const updateAnswer = (questionId: string, answerId: string, field: string, value: any) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? {
            ...q,
            answers: q.answers.map(a => 
              a.id === answerId ? { ...a, [field]: value } : a
            )
          }
        : q
    ));
  };

  const setCorrectAnswer = (questionId: string, answerId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? {
            ...q,
            answers: q.answers.map(a => ({ ...a, isCorrect: a.id === answerId }))
          }
        : q
    ));
  };

  const addAnswer = (questionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? {
            ...q,
            answers: [
              ...q.answers,
              { id: Math.random().toString(36).substr(2, 9), text: '', isCorrect: false }
            ]
          }
        : q
    ));
  };

  const removeAnswer = (questionId: string, answerId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? {
            ...q,
            answers: q.answers.filter(a => a.id !== answerId)
          }
        : q
    ));
  };

  const changeQuestionType = (questionId: string, type: 'multiple_choice' | 'true_false' | 'fill_in_blank') => {
    setQuestions(questions.map(q => {
      if (q.id !== questionId) return q;
      
      let newAnswers = q.answers;
      
      if (type === 'true_false') {
        newAnswers = [
          { id: Math.random().toString(36).substr(2, 9), text: 'True', isCorrect: true },
          { id: Math.random().toString(36).substr(2, 9), text: 'False', isCorrect: false }
        ];
      } else if (type === 'fill_in_blank') {
        newAnswers = [
          { id: Math.random().toString(36).substr(2, 9), text: '', isCorrect: true }
        ];
      } else if (type === 'multiple_choice' && q.type !== 'multiple_choice') {
        newAnswers = [
          { id: Math.random().toString(36).substr(2, 9), text: '', isCorrect: true },
          { id: Math.random().toString(36).substr(2, 9), text: '', isCorrect: false },
          { id: Math.random().toString(36).substr(2, 9), text: '', isCorrect: false },
          { id: Math.random().toString(36).substr(2, 9), text: '', isCorrect: false }
        ];
      }
      
      return { ...q, type, answers: newAnswers };
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      setError('Quiz title is required');
      return;
    }
    
    if (!formData.chapterId) {
      setError('Please select a chapter');
      return;
    }
    
    if (questions.length === 0) {
      setError('Please add at least one question');
      return;
    }
    
    // Validate questions
    for (const question of questions) {
      if (!question.text.trim()) {
        setError('All questions must have text');
        return;
      }
      
      if (question.answers.length === 0) {
        setError('All questions must have at least one answer');
        return;
      }
      
      if (question.type === 'multiple_choice' || question.type === 'true_false') {
        const hasCorrectAnswer = question.answers.some(a => a.isCorrect);
        if (!hasCorrectAnswer) {
          setError('All multiple choice and true/false questions must have a correct answer');
          return;
        }
      }
      
      for (const answer of question.answers) {
        if (!answer.text.trim()) {
          setError('All answers must have text');
          return;
        }
      }
    }
    
    try {
      setSaving(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const safePassingScore = clamp(formData.passingScore, 1, 100);
      const response = await fetch('/api/admin/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          passingScore: safePassingScore,
          timeLimit: formData.hasTimeLimit ? formData.timeLimit : null,
          questions: questions.map(q => ({
            text: q.text,
            type: q.type,
            points: q.points,
            answers: q.answers.map(a => ({
              text: a.text,
              isCorrect: a.isCorrect
            }))
          }))
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create quiz');
      }
      
      router.push('/dashboard/admin/quizzes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const filteredChapters = chapters.filter(chapter =>
    chapter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chapter.course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard/admin/quizzes')}
                  className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-4xl font-bold">Create New Quiz</h1>
                  <p className="text-indigo-100 text-lg mt-2">Add questions and configure quiz settings</p>
                </div>
              </div>
              <HelpCircle className="w-24 h-24 text-white/20 hidden md:block" />
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter quiz title..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chapter *
                </label>
                <select
                  value={formData.chapterId}
                  onChange={(e) => setFormData({ ...formData, chapterId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Select a chapter...</option>
                  {filteredChapters.map(chapter => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.course.subtopic.topic.title} → {chapter.course.subtopic.title} → {chapter.course.title} → {chapter.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter quiz description..."
              />
            </div>
          </div>

          {/* Quiz Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Quiz Settings</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.passingScore}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    setFormData({ ...formData, passingScore: clamp(Number.isNaN(n) ? 1 : n, 1, 100) });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="hasTimeLimit"
                    checked={formData.hasTimeLimit}
                    onChange={(e) => setFormData({ ...formData, hasTimeLimit: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="hasTimeLimit" className="ml-2 text-sm font-medium text-gray-700">
                    Set Time Limit
                  </label>
                </div>
                <input
                  type="number"
                  min="1"
                  value={formData.timeLimit}
                  onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) })}
                  disabled={!formData.hasTimeLimit}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Minutes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Questions ({questions.length})</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Yet</h3>
                <p className="text-gray-600 mb-4">Add your first question to get started</p>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Add Question
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((question, qIndex) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Question {qIndex + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Question Text *
                        </label>
                        <textarea
                          value={question.text}
                          onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter your question..."
                          required
                        />
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Question Type
                          </label>
                          <select
                            value={question.type}
                            onChange={(e) => changeQuestionType(question.id, e.target.value as any)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="multiple_choice">Multiple Choice</option>
                            <option value="true_false">True/False</option>
                            <option value="fill_in_blank">Fill in the Blank</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Points
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={question.points}
                            onChange={(e) => updateQuestion(question.id, 'points', parseInt(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Answers */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700">
                          {question.type === 'fill_in_blank' ? 'Correct Answers' : 'Answer Options'}
                        </h4>
                        {question.type === 'multiple_choice' && (
                          <button
                            type="button"
                            onClick={() => addAnswer(question.id)}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            + Add Answer
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {question.answers.map((answer, aIndex) => (
                          <div key={answer.id} className="flex items-center space-x-3">
                            {question.type === 'multiple_choice' && (
                              <input
                                type="radio"
                                name={`correct-${question.id}`}
                                checked={answer.isCorrect}
                                onChange={() => setCorrectAnswer(question.id, answer.id)}
                                className="text-indigo-600 focus:ring-indigo-500"
                              />
                            )}
                            {question.type === 'true_false' && (
                              <input
                                type="radio"
                                name={`correct-${question.id}`}
                                checked={answer.isCorrect}
                                onChange={() => setCorrectAnswer(question.id, answer.id)}
                                className="text-indigo-600 focus:ring-indigo-500"
                              />
                            )}
                            {question.type === 'fill_in_blank' && (
                              <Check className="w-4 h-4 text-green-600" />
                            )}
                            
                            <input
                              type="text"
                              value={answer.text}
                              onChange={(e) => updateAnswer(question.id, answer.id, 'text', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder={question.type === 'fill_in_blank' ? 'Acceptable answer...' : `Option ${aIndex + 1}...`}
                              readOnly={question.type === 'true_false'}
                              required
                            />

                            {question.type === 'multiple_choice' && question.answers.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeAnswer(question.id, answer.id)}
                                className="text-red-600 hover:text-red-800 p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}

                            {question.type === 'fill_in_blank' && question.answers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeAnswer(question.id, answer.id)}
                                className="text-red-600 hover:text-red-800 p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {question.type === 'fill_in_blank' && (
                        <button
                          type="button"
                          onClick={() => addAnswer(question.id)}
                          className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                          + Add Alternative Answer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard/admin/quizzes')}
              className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              <Save className="w-4 h-4" />
              <span>{saving ? 'Creating...' : 'Create Quiz'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
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
  Trash2,
  Edit3,
  Eye
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  type: 'multiple_choice';
  points: number;
  answers: Answer[];
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passingScore: number;
  timeLimit?: number;
  isActive: boolean;
  questions: Question[];
}

interface Chapter {
  id: string;
  title: string;
  course: {
    id: string;
    title: string;
    subtopic: {
      id: string;
      title: string;
      topic: {
        id: string;
        title: string;
      };
    };
  };
  quiz?: Quiz;
}

export default function ChapterQuizPage() {
  const [user, setUser] = useState<User | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    passingScore: 70,
    timeLimit: 30,
    hasTimeLimit: false,
    isActive: true
  });

  const [questions, setQuestions] = useState<Question[]>([]);

  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const chapterId = params.id as string;
  const courseId = searchParams.get('courseId');
  const topicId = searchParams.get('topicId');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'admin') {
        router.push('/dashboard');
      } else {
        setUser(parsedUser);
        fetchChapterAndQuiz(token);
      }
    } else {
      router.push('/login');
    }
  }, [router, chapterId]);

  const fetchChapterAndQuiz = async (token: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/chapters/${chapterId}/quiz`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Chapter exists but no quiz, fetch chapter info only
          const chapterResponse = await fetch(`/api/admin/chapters/${chapterId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (chapterResponse.ok) {
            const chapterData = await chapterResponse.json();
            setChapter(chapterData.chapter);
            // Set default quiz title based on chapter
            setFormData(prev => ({
              ...prev,
              title: `${chapterData.chapter.title} - Quiz`
            }));
          } else {
            throw new Error('Chapter not found');
          }
          return;
        }
        throw new Error('Failed to fetch chapter quiz');
      }

      const data = await response.json();
      const chapterData = data.chapter;
      setChapter(chapterData);
      
      if (chapterData.quiz) {
        // Populate form with existing quiz data
        setFormData({
          title: chapterData.quiz.title,
          description: chapterData.quiz.description || '',
          passingScore: chapterData.quiz.passingScore,
          timeLimit: chapterData.quiz.timeLimit || 30,
          hasTimeLimit: !!chapterData.quiz.timeLimit,
          isActive: chapterData.quiz.isActive
        });

        // Convert quiz questions to form questions
        const formQuestions: Question[] = chapterData.quiz.questions.map((q: any) => ({
          id: q.id,
          text: q.text,
          type: 'multiple_choice',
          points: q.points,
          answers: q.answers.map((a: any) => ({
            id: a.id,
            text: a.text,
            isCorrect: a.isCorrect
          }))
        }));
        
        setQuestions(formQuestions);
      } else {
        // Set default quiz title based on chapter
        setFormData(prev => ({
          ...prev,
          title: `${chapterData.title} - Quiz`
        }));
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      setError('Quiz title is required');
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
      
      if (question.answers.length !== 4) {
        setError('All multiple choice questions must have exactly 4 answers');
        return;
      }
      
      const hasCorrectAnswer = question.answers.some(a => a.isCorrect);
      if (!hasCorrectAnswer) {
        setError('All questions must have one correct answer');
        return;
      }
      
      const correctAnswers = question.answers.filter(a => a.isCorrect);
      if (correctAnswers.length !== 1) {
        setError('Each question must have exactly one correct answer');
        return;
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
      const method = chapter?.quiz ? 'PUT' : 'POST';
      const url = `/api/admin/chapters/${chapterId}/quiz`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
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
        throw new Error(data.error || 'Failed to save quiz');
      }
      
      // Navigate back to chapter list
      if (courseId && topicId) {
        router.push(`/dashboard/admin/courses/${courseId}/chapters?topicId=${topicId}`);
      } else {
        router.back();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleGoBack = () => {
    if (courseId && topicId) {
      router.push(`/dashboard/admin/courses/${courseId}/chapters?topicId=${topicId}`);
    } else {
      router.back();
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !chapter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Chapter Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/dashboard/admin/courses')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl shadow-xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleGoBack}
                  className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-4xl font-bold mb-2">Chapter Quiz</h1>
                  <p className="text-amber-100 text-lg">{chapter?.title}</p>
                  <div className="flex items-center space-x-2 mt-2 text-sm text-amber-200">
                    <span>{chapter?.course.subtopic.topic.title}</span>
                    <span>•</span>
                    <span>{chapter?.course.subtopic.title}</span>
                    <span>•</span>
                    <span>{chapter?.course.title}</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <HelpCircle className="w-24 h-24 text-white/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800 font-medium">Error: {error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-amber-100 rounded-lg p-2">
                <BookOpen className="w-6 h-6 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Quiz Information</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Enter quiz title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.passingScore}
                  onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Enter quiz description"
                />
              </div>

              <div className="lg:col-span-2 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">Time Limit</h3>
                    <p className="text-sm text-gray-600">Set a time limit for this quiz</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {formData.hasTimeLimit && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={formData.timeLimit}
                        onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) })}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <span className="text-sm text-gray-600">minutes</span>
                    </div>
                  )}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasTimeLimit}
                      onChange={(e) => setFormData({ ...formData, hasTimeLimit: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
              </div>

              <div className="lg:col-span-2 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Quiz Status</h3>
                  <p className="text-sm text-gray-600">Make this quiz active and available to students</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-amber-100 rounded-lg p-2">
                  <HelpCircle className="w-6 h-6 text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Questions ({questions.length})</h2>
              </div>
              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center space-x-2 bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Yet</h3>
                <p className="text-gray-600 mb-4">Add your first multiple choice question to get started</p>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
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

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
                      <div className="lg:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Question Text *
                        </label>
                        <textarea
                          value={question.text}
                          onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          placeholder="Enter your question..."
                          required
                        />
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Answer Options */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Answer Options (Select the correct answer)
                      </h4>

                      <div className="space-y-3">
                        {question.answers.map((answer, aIndex) => (
                          <div key={answer.id} className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={answer.isCorrect}
                              onChange={() => setCorrectAnswer(question.id, answer.id)}
                              className="text-amber-600 focus:ring-amber-500"
                              title="Select as correct answer"
                            />
                            
                            <div className="flex-1 flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-500 w-8">
                                {String.fromCharCode(65 + aIndex)}.
                              </span>
                              <input
                                type="text"
                                value={answer.text}
                                onChange={(e) => updateAnswer(question.id, answer.id, 'text', e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                placeholder={`Option ${String.fromCharCode(65 + aIndex)}`}
                                required
                              />
                            </div>

                            {answer.isCorrect && (
                              <div className="flex items-center space-x-1 text-green-600">
                                <Check className="w-4 h-4" />
                                <span className="text-xs font-medium">Correct</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
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
              onClick={handleGoBack}
              className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : (chapter?.quiz ? 'Update Quiz' : 'Create Quiz')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

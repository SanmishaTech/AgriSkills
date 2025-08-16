'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Edit,
  Eye,
  Clock,
  Users,
  BookOpen,
  CheckCircle,
  XCircle,
  Calendar,
  Award,
  BarChart3,
  Settings,
  AlertCircle
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passingScore: number;
  timeLimit?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  chapter: {
    title: string;
    course: {
      title: string;
      subtopic: {
        title: string;
        topic: {
          title: string;
        };
      };
    };
  };
  questions: {
    id: string;
    text: string;
    type: string;
    points: number;
    orderIndex: number;
    answers: {
      id: string;
      text: string;
      isCorrect: boolean;
      orderIndex: number;
    }[];
  }[];
  _count: {
    questions: number;
    attempts: number;
  };
  attempts?: {
    id: string;
    score: number;
    totalPoints: number;
    maxPoints: number;
    isPassed: boolean;
    timeSpent?: number;
    startedAt: string;
    completedAt?: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }[];
}

export default function QuizDetailPage() {
  const [user, setUser] = useState<User | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'attempts'>('overview');

  const router = useRouter();
  const params = useParams();
  const quizId = params.id as string;

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'admin') {
        router.push('/dashboard');
      } else {
        setUser(parsedUser);
        fetchQuizDetail(token);
      }
    } else {
      router.push('/login');
    }
  }, [router, quizId]);

  const fetchQuizDetail = async (token: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/quizzes/${quizId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Quiz not found');
        }
        throw new Error('Failed to fetch quiz details');
      }

      const data = await response.json();
      setQuiz(data.quiz);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Quiz Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The quiz you are looking for does not exist.'}</p>
            <button
              onClick={() => router.push('/dashboard/admin/quizzes')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalAttempts = quiz.attempts?.length || 0;
  const passedAttempts = quiz.attempts?.filter(a => a.isPassed).length || 0;
  const averageScore = totalAttempts > 0 
    ? quiz.attempts!.reduce((sum, a) => sum + a.score, 0) / totalAttempts 
    : 0;
  const averageTime = quiz.attempts?.filter(a => a.timeSpent).length 
    ? quiz.attempts!.filter(a => a.timeSpent).reduce((sum, a) => sum + (a.timeSpent || 0), 0) / quiz.attempts!.filter(a => a.timeSpent).length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
                  <h1 className="text-4xl font-bold">{quiz.title}</h1>
                  <p className="text-indigo-100 text-lg mt-2">
                    {quiz.chapter.course.subtopic.topic.title} → {quiz.chapter.course.subtopic.title} → {quiz.chapter.course.title} → {quiz.chapter.title}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push(`/dashboard/admin/quizzes/${quiz.id}/edit`)}
                  className="bg-white/20 hover:bg-white/30 rounded-lg p-3 transition-colors"
                >
                  <Edit className="w-6 h-6" />
                </button>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  quiz.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {quiz.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-blue-50 rounded-lg p-3 mr-4">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Questions</p>
                <p className="text-3xl font-bold text-gray-900">{quiz.questions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-green-50 rounded-lg p-3 mr-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                <p className="text-3xl font-bold text-gray-900">{totalAttempts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-yellow-50 rounded-lg p-3 mr-4">
                <Award className="w-8 h-8 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="bg-purple-50 rounded-lg p-3 mr-4">
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Score</p>
                <p className="text-3xl font-bold text-gray-900">{Math.round(averageScore)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('questions')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'questions'
                    ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Questions ({quiz.questions.length})
              </button>
              <button
                onClick={() => setActiveTab('attempts')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'attempts'
                    ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Attempts ({totalAttempts})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quiz Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <p className="text-gray-900">{quiz.description || 'No description provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Passing Score</label>
                      <p className="text-gray-900">{quiz.passingScore}%</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit</label>
                      <p className="text-gray-900">
                        {quiz.timeLimit ? `${quiz.timeLimit} minutes` : 'No time limit'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total Points</label>
                      <p className="text-gray-900">
                        {quiz.questions.reduce((sum, q) => sum + q.points, 0)} points
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Created</label>
                      <p className="text-gray-900">
                        {new Date(quiz.createdAt).toLocaleDateString()} at {new Date(quiz.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Updated</label>
                      <p className="text-gray-900">
                        {new Date(quiz.updatedAt).toLocaleDateString()} at {new Date(quiz.updatedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Performance Stats */}
                {totalAttempts > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Average Score</p>
                            <p className="text-2xl font-bold text-gray-900">{Math.round(averageScore)}%</p>
                          </div>
                          <BarChart3 className="w-8 h-8 text-indigo-600" />
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Pass Rate</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {Math.round((passedAttempts / totalAttempts) * 100)}%
                            </p>
                          </div>
                          <Award className="w-8 h-8 text-green-600" />
                        </div>
                      </div>
                      
                      {averageTime > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Average Time</p>
                              <p className="text-2xl font-bold text-gray-900">{Math.round(averageTime)} min</p>
                            </div>
                            <Clock className="w-8 h-8 text-blue-600" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'questions' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Quiz Questions</h3>
                  <span className="text-sm text-gray-500">
                    {quiz.questions.length} questions • {quiz.questions.reduce((sum, q) => sum + q.points, 0)} total points
                  </span>
                </div>

                {quiz.questions.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Questions</h4>
                    <p className="text-gray-600">This quiz doesn't have any questions yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quiz.questions.map((question, index) => (
                      <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border border-gray-200 rounded-lg p-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-3">
                            <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-2 py-1 rounded">
                              Q{index + 1}
                            </span>
                            <div>
                              <h4 className="text-lg font-medium text-gray-900 mb-2">{question.text}</h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="bg-gray-100 px-2 py-1 rounded capitalize">
                                  {question.type.replace('_', ' ')}
                                </span>
                                <span>{question.points} point{question.points !== 1 ? 's' : ''}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="ml-12">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Answer Options:</h5>
                          <div className="space-y-2">
                            {question.answers.map((answer) => (
                              <div
                                key={answer.id}
                                className={`flex items-center space-x-3 p-2 rounded ${
                                  answer.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                                }`}
                              >
                                {answer.isCorrect ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <div className="w-4 h-4 border border-gray-300 rounded-full"></div>
                                )}
                                <span className={answer.isCorrect ? 'text-green-800 font-medium' : 'text-gray-700'}>
                                  {answer.text}
                                </span>
                                {answer.isCorrect && (
                                  <span className="text-xs text-green-600 font-medium">Correct</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'attempts' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Quiz Attempts</h3>
                  <span className="text-sm text-gray-500">{totalAttempts} total attempts</span>
                </div>

                {!quiz.attempts || quiz.attempts.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Attempts</h4>
                    <p className="text-gray-600">No one has attempted this quiz yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Score
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Points
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time Spent
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Completed
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {quiz.attempts.map((attempt) => (
                          <tr key={attempt.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {attempt.user.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {attempt.user.email}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {Math.round(attempt.score)}%
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {attempt.totalPoints} / {attempt.maxPoints}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {attempt.timeSpent ? `${attempt.timeSpent} min` : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                attempt.isPassed
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {attempt.isPassed ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Passed
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Failed
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {attempt.completedAt 
                                ? new Date(attempt.completedAt).toLocaleDateString()
                                : 'In Progress'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            onClick={() => router.push('/dashboard/admin/quizzes')}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
          >
            Back to Quizzes
          </button>
          <button
            onClick={() => router.push(`/dashboard/admin/quizzes/${quiz.id}/edit`)}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Quiz</span>
          </button>
        </div>
      </div>
    </div>
  );
}

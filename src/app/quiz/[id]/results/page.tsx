'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Trophy,
  XCircle,
  CheckCircle,
  RefreshCw,
  Home,
  Award,
  Clock,
  Target,
  TrendingUp,
  BookOpen,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface QuizResult {
  id: string;
  score: number;
  totalPoints: number;
  maxPoints: number;
  isPassed: boolean;
  timeSpent: number | null;
  completedAt: string;
  quiz: {
    id: string;
    title: string;
    passingScore: number;
    chapter: {
      id: string;
      title: string;
      course: {
        id: string;
        title: string;
      };
    };
  };
  responses: Array<{
    id: string;
    isCorrect: boolean;
    pointsEarned: number;
    selectedText: string | null;
    question: {
      id: string;
      text: string;
      type: string;
      points: number;
      answers: Array<{
        id: string;
        text: string;
        isCorrect: boolean;
      }>;
    };
  }>;
  courseCompleted?: boolean;
}

export default function QuizResultsPage() {
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const quizId = params.id as string;
  const attemptId = searchParams.get('attemptId');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userData || !token) {
      router.push('/login');
      return;
    }

    if (!attemptId) {
      setError('No attempt ID provided');
      setLoading(false);
      return;
    }

    loadResults();
  }, [attemptId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/quiz/${quizId}/results?attemptId=${attemptId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load results');
      }

      const data = await response.json();
      setResult(data.result);
    } catch (err) {
      console.error('Error loading results:', err);
      setError(err instanceof Error ? err.message : 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryQuiz = async () => {
    setRetrying(true);
    // Navigate to quiz page to start a new attempt
    router.push(`/quiz/${quizId}`);
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard/user');
  };

  const handleContinueLearning = () => {
    if (result?.quiz.chapter.course.id) {
      router.push(`/course/${result.quiz.chapter.course.id}/chapters`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Results</h1>
            <p className="text-gray-600 mb-6">{error || 'Unable to load quiz results'}</p>
            <button
              onClick={handleGoToDashboard}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const percentage = Math.round(result.score);
  const correctAnswers = result.responses.filter(r => r.isCorrect).length;
  const totalQuestions = result.responses.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Result Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header with Pass/Fail Status */}
          <div className={`p-8 text-white ${
            result.isPassed 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
              : 'bg-gradient-to-r from-red-500 to-rose-600'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  {result.isPassed ? (
                    <Trophy className="w-10 h-10" />
                  ) : (
                    <XCircle className="w-10 h-10" />
                  )}
                  <h1 className="text-3xl font-bold">
                    {result.isPassed ? 'Congratulations!' : 'Quiz Not Passed'}
                  </h1>
                </div>
                <p className="text-xl opacity-90">
                  {result.isPassed 
                    ? 'You have successfully passed the quiz!' 
                    : 'You need to score at least ' + result.quiz.passingScore + '% to pass'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold">{percentage}%</div>
                <div className="text-sm opacity-75 mt-1">Your Score</div>
              </div>
            </div>
          </div>

          {/* Quiz Info */}
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{result.quiz.title}</h2>
              <div className="flex items-center space-x-2 text-gray-600">
                <BookOpen className="w-4 h-4" />
                <span>{result.quiz.chapter.title}</span>
                <ChevronRight className="w-4 h-4" />
                <span>{result.quiz.chapter.course.title}</span>
              </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {result.totalPoints}/{result.maxPoints}
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-indigo-600" />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Correct</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {correctAnswers}/{totalQuestions}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Time Spent</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {result.timeSpent || 0}m
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Required</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {result.quiz.passingScore}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Course Completion Status */}
            {result.isPassed && result.courseCompleted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6"
              >
                <div className="flex items-center">
                  <Award className="w-6 h-6 text-green-600 mr-3" />
                  <div>
                    <p className="font-semibold text-green-900">Course Completed!</p>
                    <p className="text-sm text-green-700">
                      You have successfully completed {result.quiz.chapter.course.title}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {result.isPassed ? (
                <>
                  <button
                    onClick={handleContinueLearning}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>Continue Learning</span>
                  </button>
                  <button
                    onClick={handleGoToDashboard}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Home className="w-5 h-5" />
                    <span>Go to Dashboard</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleRetryQuiz}
                    disabled={retrying}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-5 h-5 ${retrying ? 'animate-spin' : ''}`} />
                    <span>{retrying ? 'Loading...' : 'Retry Quiz'}</span>
                  </button>
                  <button
                    onClick={handleGoToDashboard}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Home className="w-5 h-5" />
                    <span>Back to Dashboard</span>
                  </button>
                </>
              )}
            </div>

            {/* Detailed Results Toggle */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center space-x-2"
              >
                <span>{showDetails ? 'Hide' : 'Show'} Detailed Results</span>
                <ChevronRight className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
              </button>

              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 space-y-4"
                >
                  {result.responses.map((response, index) => (
                    <div
                      key={response.id}
                      className={`p-4 rounded-lg border ${
                        response.isCorrect 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {response.isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          <span className="font-medium text-gray-900">
                            Question {index + 1}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {response.pointsEarned}/{response.question.points} points
                        </span>
                      </div>
                      <p className="text-gray-800 mb-2">{response.question.text}</p>
                      <div className="text-sm">
                        <p className="text-gray-600">
                          Your answer: <span className="font-medium">{response.selectedText || 'No answer'}</span>
                        </p>
                      
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

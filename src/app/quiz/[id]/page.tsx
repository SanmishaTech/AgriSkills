'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Send,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  BookOpen
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
}

interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'fill_in_blank';
  points: number;
  answers: Answer[];
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passingScore: number;
  timeLimit?: number;
  questions: Question[];
}

interface AttemptResponse {
  questionId: string;
  answerId?: string;
  text?: string;
}

export default function QuizPage() {
  const [user, setUser] = useState<User | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, AttemptResponse>>({});
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const router = useRouter();
  const params = useParams();
  const quizId = params.id as string;

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      console.log('Quiz Auth Check:', { 
        hasToken: !!token, 
        hasUserData: !!userData,
        token: token ? token.substring(0, 20) + '...' : null 
      });
      
      if (!token || !userData) {
        console.log('No auth found, redirecting to login');
        router.push('/login');
        return;
      }
      
      const user = JSON.parse(userData);
      setUser(user);
      
      // Check if user has already passed this quiz (for informational purposes)
      try {
        const statusResponse = await fetch('/api/quiz/check-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ chapterIds: [quizId] })
        });
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          if (statusData.statusMap[quizId]?.passed) {
            // User has already passed this quiz - show info but allow retake
            setError('You have already passed this quiz! You can retake it to improve your score.');
          }
        }
      } catch (error) {
        console.error('Error checking quiz status:', error);
      }
    };

    checkAuth();
  }, [quizId, router]);

  // Removed duplicate auth check - handled in the main auth useEffect above

  // Timer effect
  useEffect(() => {
    if (!hasStarted || !startTime || !quiz?.timeLimit) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime.getTime();
      const totalTime = quiz.timeLimit! * 60 * 1000; // Convert minutes to milliseconds
      const remaining = totalTime - elapsed;

      if (remaining <= 0) {
        handleSubmitQuiz(true); // Auto-submit when time runs out
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [hasStarted, startTime, quiz?.timeLimit]);

  const startQuiz = async () => {
    if (!user) return;
    
    try {
      setStarting(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      // Check if token exists
      if (!token) {
        router.push('/login');
        return;
      }
      
      const response = await fetch(`/api/quiz/${quizId}/attempt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // If unauthorized, redirect to login
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }
        if (response.status === 404) {
          throw new Error('Quiz not found or has been deactivated');
        } else if (response.status === 401) {
          throw new Error('You are not authorized to take this quiz');
        } else {
          throw new Error(data.error || 'Failed to start quiz');
        }
      }

      if (!data.attempt || !data.attempt.quiz) {
        throw new Error('Invalid quiz data received');
      }

      setQuiz(data.attempt.quiz);
      setAttemptId(data.attempt.id);
      setStartTime(new Date(data.attempt.startedAt));
      setHasStarted(true);

      if (data.attempt.timeLimit) {
        const startedAt = new Date(data.attempt.startedAt);
        const elapsed = Date.now() - startedAt.getTime();
        const totalTime = data.attempt.timeLimit * 60 * 1000;
        setTimeRemaining(totalTime - elapsed);
      }

    } catch (err) {
      console.error('Quiz start error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while starting the quiz');
    } finally {
      setStarting(false);
    }
  };

  const loadQuizInfo = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      // Check if token exists
      if (!token) {
        router.push('/login');
        return;
      }
      
      // First, fetch quiz info using GET endpoint
      const quizResponse = await fetch(`/api/quiz/${quizId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!quizResponse.ok) {
        const quizData = await quizResponse.json();
        
        // If unauthorized, redirect to login
        if (quizResponse.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }
        
        throw new Error(quizData.error || 'Failed to load quiz');
      }

      const quizData = await quizResponse.json();
      
      // Check if quiz is available
      if (!quizData.success || !quizData.quiz) {
        throw new Error('Quiz not found');
      }

      // If there's an active attempt, load it
      if (quizData.hasActiveAttempt) {
        // Try to continue the active attempt
        const attemptResponse = await fetch(`/api/quiz/${quizId}/attempt`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const attemptData = await attemptResponse.json();
        
        if (attemptResponse.ok && attemptData.attempt) {
          const startedAt = new Date(attemptData.attempt.startedAt);
          const now = new Date();
          
          // Check if time limit exceeded
          if (attemptData.attempt.timeLimit) {
            const elapsed = now.getTime() - startedAt.getTime();
            const timeLimit = attemptData.attempt.timeLimit * 60 * 1000;
            
            if (elapsed > timeLimit) {
              setError('Time limit exceeded. This attempt has expired.');
              setQuiz(null);
              return;
            }
          }
          
          setQuiz(attemptData.attempt.quiz);
          setAttemptId(attemptData.attempt.id);
          setStartTime(startedAt);
          setHasStarted(true);

          if (attemptData.attempt.timeLimit) {
            const elapsed = now.getTime() - startedAt.getTime();
            const totalTime = attemptData.attempt.timeLimit * 60 * 1000;
            setTimeRemaining(totalTime - elapsed);
          }
        }
      } else {
        // No active attempt, show quiz info for starting
        // We'll create the attempt when user clicks "Start Quiz"
        setQuiz({
          id: quizData.quiz.id,
          title: quizData.quiz.title,
          description: quizData.quiz.description,
          passingScore: quizData.quiz.passingScore,
          timeLimit: quizData.quiz.timeLimit,
          questions: [] // Will be loaded when starting
        });
      }

    } catch (err) {
      console.error('Quiz loading error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while loading the quiz');
      setQuiz(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadQuizInfo();
    }
  }, [user, quizId]);

  const handleAnswerChange = (questionId: string, answerId?: string, text?: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { questionId, answerId, text }
    }));
  };

  const handleSubmitQuiz = async (autoSubmit = false) => {
    if (!attemptId || !quiz) return;

    if (!autoSubmit) {
      setShowConfirmSubmit(false);
    }

    try {
      setSubmitting(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/quiz/${quizId}/attempt`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          attemptId,
          answers: Object.values(responses)
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit quiz');
      }

      // Redirect to results page
      router.push(`/quiz/${quizId}/results?attemptId=${attemptId}`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(responses).length;
  };

  const currentQuestion = quiz?.questions[currentQuestionIndex];

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Quiz Unavailable</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz introduction screen
  if (!hasStarted && quiz) {
    return (
      <div className="min-h-screen bg-gray-50">
         
        
        {/* Show info if user has already passed */}
        {error && error.includes('already passed') && (
          <div className="max-w-3xl mx-auto mt-8 px-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-green-800 mb-2">Quiz Already Passed!</h2>
              <p className="text-green-600 mb-4">Great job! You have successfully passed this quiz.</p>
              <p className="text-sm text-gray-600">You can retake it below to practice or improve your score.</p>
            </div>
          </div>
        )}
        
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
                  <p className="text-indigo-100">
                    Ready to start the quiz
                  </p>
                </div>
                <BookOpen className="w-16 h-16 text-white/20" />
              </div>
            </div>

            <div className="p-8">
              {quiz.description && (
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">Description</h2>
                  <p className="text-gray-600">{quiz.description}</p>
                </div>
              )}

              {/* Quiz Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <HelpCircle className="w-6 h-6 text-indigo-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Questions</p>
                      <p className="text-lg font-semibold text-gray-900">Quiz Ready</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Passing Score</p>
                      <p className="text-lg font-semibold text-gray-900">{quiz.passingScore}%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Clock className="w-6 h-6 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Time Limit</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {quiz.timeLimit ? `${quiz.timeLimit} minutes` : 'No limit'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-blue-900 mb-3">Instructions</h3>
                <ul className="space-y-2 text-blue-800">
                  <li>• Read each question carefully before answering</li>
                  <li>• You can navigate between questions using the Previous/Next buttons</li>
                  <li>• Your progress is saved automatically</li>
                  {quiz.timeLimit && (
                    <li>• You have {quiz.timeLimit} minutes to complete the quiz</li>
                  )}
                  <li>• Make sure to submit your quiz before the time runs out</li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <p className="text-red-800 font-medium">{error}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center space-x-2 px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  onClick={startQuiz}
                  disabled={starting}
                  className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {starting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                  <span>{starting ? 'Starting...' : 'Start Quiz'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz taking interface
  if (hasStarted && quiz && currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          {/* Header with timer and progress */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
                <p className="text-sm text-gray-600">
                  Question {currentQuestionIndex + 1} of {quiz.questions.length} • 
                  {getAnsweredCount()} answered
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                {timeRemaining !== null && (
                  <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                    timeRemaining < 5 * 60 * 1000 ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    <Clock className="w-4 h-4" />
                    <span className="font-mono font-medium">
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{Math.round((getAnsweredCount() / quiz.questions.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(getAnsweredCount() / quiz.questions.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Question */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full">
                  Question {currentQuestionIndex + 1}
                </span>
                <span className="text-sm text-gray-500">
                  {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
                </span>
              </div>
              
              <h2 className="text-xl font-medium text-gray-900 mb-6">
                {currentQuestion.text}
              </h2>

              {/* Answer options */}
              <div className="space-y-3">
                {currentQuestion.type === 'multiple_choice' && currentQuestion.answers.map((answer) => {
                  const isSelected = responses[currentQuestion.id]?.answerId === answer.id;
                  return (
                    <label
                      key={answer.id}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          value={answer.id}
                          checked={isSelected}
                          onChange={() => handleAnswerChange(currentQuestion.id, answer.id)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                          isSelected ? 'border-indigo-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>}
                        </div>
                        <span className="text-gray-900">{answer.text}</span>
                      </div>
                    </label>
                  );
                })}

                {currentQuestion.type === 'true_false' && currentQuestion.answers.map((answer) => {
                  const isSelected = responses[currentQuestion.id]?.answerId === answer.id;
                  return (
                    <label
                      key={answer.id}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          value={answer.id}
                          checked={isSelected}
                          onChange={() => handleAnswerChange(currentQuestion.id, answer.id)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                          isSelected ? 'border-indigo-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>}
                        </div>
                        <span className="text-gray-900">{answer.text}</span>
                      </div>
                    </label>
                  );
                })}

                {currentQuestion.type === 'fill_in_blank' && (
                  <div>
                    <input
                      type="text"
                      placeholder="Enter your answer..."
                      value={responses[currentQuestion.id]?.text || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, undefined, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center space-x-3">
                {currentQuestionIndex === quiz.questions.length - 1 ? (
                  <button
                    onClick={() => setShowConfirmSubmit(true)}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Quiz</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestionIndex(Math.min(quiz.questions.length - 1, currentQuestionIndex + 1))}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Question navigation */}
          <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Jump to Question:</h3>
            <div className="grid grid-cols-10 gap-2">
              {quiz.questions.map((_, index) => {
                const isAnswered = responses[quiz.questions[index].id];
                const isCurrent = index === currentQuestionIndex;
                
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                      isCurrent
                        ? 'bg-indigo-600 text-white'
                        : isAnswered
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {showConfirmSubmit && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={(e) => e.target === e.currentTarget && setShowConfirmSubmit(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              >
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full mb-4">
                  <Send className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Submit Quiz</h3>
                  <p className="text-gray-600">
                    You have answered {getAnsweredCount()} out of {quiz.questions.length} questions. 
                    Are you sure you want to submit your quiz?
                  </p>
                  {getAnsweredCount() < quiz.questions.length && (
                    <p className="text-amber-600 text-sm mt-2 font-medium">
                      ⚠ You have unanswered questions. They will be marked as incorrect.
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-end space-x-4">
                  <button
                    onClick={() => setShowConfirmSubmit(false)}
                    disabled={submitting}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSubmitQuiz()}
                    disabled={submitting}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {submitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                    <span>{submitting ? 'Submitting...' : 'Submit Quiz'}</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
}

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, CheckCircle2, Circle } from 'lucide-react';

interface TopicQuestion {
  id: string;
  question: string;
  isActive: boolean;
  orderIndex: number;
}

interface TopicQuestionsProps {
  topicId: string;
}

export default function TopicQuestions({ topicId }: TopicQuestionsProps) {
  const [questions, setQuestions] = useState<TopicQuestion[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch questions for the topic
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(`/api/topics/${topicId}/questions`);
        if (!response.ok) {
          throw new Error('Failed to fetch questions');
        }
        const data = await response.json();
        setQuestions(data.questions || []);
      } catch (error) {
        console.error('Failed to fetch questions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [topicId]);

  // Load user's previous selections (from localStorage for now)
  useEffect(() => {
    const savedSelections = localStorage.getItem(`topic-questions-${topicId}`);
    if (savedSelections) {
      try {
        const selections = JSON.parse(savedSelections);
        setSelectedQuestions(new Set(selections));
      } catch (error) {
        console.error('Failed to load saved selections:', error);
      }
    }
  }, [topicId]);

  const handleQuestionToggle = (questionId: string) => {
    setSelectedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleSaveSelections = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      // Save to localStorage (in a real app, this would save to the database)
      localStorage.setItem(`topic-questions-${topicId}`, JSON.stringify([...selectedQuestions]));
      
      // Show success message
      setMessage({ type: 'success', text: 'Your question selections have been saved!' });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save selections:', error);
      setMessage({ type: 'error', text: 'Failed to save your selections. Please try again.' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-green-600" />
          Questions for Discussion
        </h2>
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading questions...</p>
        </div>
      </section>
    );
  }

  if (questions.length === 0) {
    return (
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-green-600" />
          Questions for Discussion
        </h2>
        <div className="bg-white rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
          <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Available</h3>
          <p className="text-gray-600">Questions for this topic will be available soon.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-green-600" />
          Questions for Discussion
        </h2>
        {selectedQuestions.size > 0 && (
          <button
            onClick={handleSaveSelections}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Save Selections ({selectedQuestions.size})
              </>
            )}
          </button>
        )}
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Select questions that interest you or that you'd like to explore further during your learning journey.
          </p>
          
          <div className="space-y-4">
            {questions.map((question) => {
              const isSelected = selectedQuestions.has(question.id);
              return (
                <motion.div
                  key={question.id}
                  whileHover={{ scale: 1.01 }}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-green-500 bg-green-50 shadow-sm'
                      : 'border-gray-200 hover:border-green-300 hover:shadow-sm'
                  }`}
                  onClick={() => handleQuestionToggle(question.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        isSelected ? 'text-green-900' : 'text-gray-900'
                      }`}>
                        {question.question}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {selectedQuestions.size > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Selected Questions</h4>
              <p className="text-sm text-blue-700">
                You have selected {selectedQuestions.size} question{selectedQuestions.size !== 1 ? 's' : ''} for further exploration.
                These selections will help personalize your learning experience.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

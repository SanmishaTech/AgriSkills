'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Play, Clock, Users, Award, ChevronRight, Star } from 'lucide-react';
import Image from 'next/image';
import TopicQuestions from './components/TopicQuestions';

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  enrolledCount: number;
}

interface Subtopic {
  id: string;
  title: string;
  description: string;
  courseCount: number;
  courses: Course[];
}

interface DemoVideo {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  youtubeId: string;
  instructor: string;
}

interface Topic {
  id: string;
  title: string;
  description: string;
  icon: string;
  subtopics: Subtopic[];
  totalCourses: number;
  totalStudents: number;
  rating: number;
}

export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [demoVideos, setDemoVideos] = useState<DemoVideo[]>([]);
  const [demoContent, setDemoContent] = useState<string>('');
  const [selectedVideo, setSelectedVideo] = useState<DemoVideo | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const handleGetStarted = () => {
    router.push(isLoggedIn ? '/dashboard/user' : '/register');
  };

  const handleTryFirstCourse = async (courseId: string) => {
    if (!isLoggedIn) {
      router.push(`/learn-free/${courseId}`);
      return;
    }

    try {
      const res = await fetch(`/api/courses/${courseId}/chapters`);
      if (!res.ok) {
        router.push(`/learn-free/${courseId}`);
        return;
      }
      const data = await res.json();
      const chapters = Array.isArray(data?.course?.chapters) ? data.course.chapters : [];
      if (chapters.length === 0) {
        router.push(`/learn-free/${courseId}`);
        return;
      }

      const sorted = [...chapters].sort((a: any, b: any) => (a?.orderIndex ?? 0) - (b?.orderIndex ?? 0));
      const firstChapterId = sorted[0]?.id;

      if (typeof firstChapterId === 'string' && firstChapterId.length > 0) {
        router.push(`/learn/chapter/${firstChapterId}`);
        return;
      }

      router.push(`/learn-free/${courseId}`);
    } catch {
      router.push(`/learn-free/${courseId}`);
    }
  };

  useEffect(() => {
    const fetchTopicDetails = async () => {
      try {
        const response = await fetch(`/api/topics/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch topic details');
        }
        const data = await response.json();
        setTopic(data.topic);
        setDemoVideos(data.demoVideos || []);
        setDemoContent(data.demoContent || '');
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch topic details:', error);
        setLoading(false);
      }
    };

    fetchTopicDetails();
  }, [params.id]);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      setIsLoggedIn(!!(token && user));
    } catch {
      setIsLoggedIn(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Topic not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          
          <div className="flex items-start gap-6">
            <div className="text-6xl">{topic.icon}</div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{topic.title}</h1>
              <p className="text-white/90 text-lg mb-4">{topic.description}</p>
              
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{topic.totalCourses} Courses</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{topic.totalStudents.toLocaleString()} Students</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{topic.rating} Rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Topic Overview Section - Full Width */}
        {demoContent && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-green-600" />
              Topic Overview
            </h2>
            <div className="bg-white rounded-xl shadow-sm p-8 border">
              <div 
                className="prose prose-green prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: demoContent }}
              />
            </div>
          </section>
        )}

        {/* Demo Videos and Subtopics Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Side - Demo Videos */}
          <div className="lg:col-span-7">
            {/* Demo Videos Section */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Play className="w-6 h-6 text-green-600" />
                Demo Videos
              </h2>
              {demoVideos.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {/* Featured/First Video - Large */}
                  <motion.div
                    key={demoVideos[0].id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
                  >
                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative group">
                      <iframe
                        src={`https://www.youtube.com/embed/${demoVideos[0].youtubeId}?rel=0&modestbranding=1`}
                        title={demoVideos[0].title}
                        className="w-full h-full rounded-t-xl"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{demoVideos[0].title}</h3>
                        </div>
                        {demoVideos[0].duration !== '0:00' && (
                          <div className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            <Clock className="w-4 h-4" />
                            {demoVideos[0].duration}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Additional Videos - Grid */}
                  {demoVideos.length > 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {demoVideos.slice(1).map((video) => (
                        <motion.div
                          key={video.id}
                          whileHover={{ y: -4 }}
                          className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all group"
                        >
                          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative">
                            <iframe
                              src={`https://www.youtube.com/embed/${video.youtubeId}?rel=0&modestbranding=1`}
                              title={video.title}
                              className="w-full h-full"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          </div>
                          <div className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-green-600 transition-colors line-clamp-2">
                              {video.title}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">by {video.instructor}</p>
                            {video.duration !== '0:00' && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>{video.duration}</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
                  <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Demo Videos Yet</h3>
                  <p className="text-gray-600">Demo videos for this topic will be available soon.</p>
                </div>
              )}
            </section>

          </div>

          {/* Right Side - Subtopics and Courses */}
          <div className="lg:col-span-5">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Subtopics & Courses</h2>
              <div className="space-y-4">
                {topic.subtopics.map((subtopic) => (
                  <motion.div
                    key={subtopic.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-sm overflow-hidden"
                  >
                    <button
                      onClick={() => setSelectedSubtopic(
                        selectedSubtopic === subtopic.id ? null : subtopic.id
                      )}
                      className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-base text-gray-900 mb-1">
                          {subtopic.title}
                          {subtopic.courseCount === 0 && (
                            <span className="ml-2 text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-600 font-normal">
                              Coming Soon
                            </span>
                          )}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2">{subtopic.description}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <BookOpen className="w-3 h-3" />
                          <span>{subtopic.courseCount} Courses</span>
                          {subtopic.courseCount === 0 && <span className="text-orange-600">(Coming Soon)</span>}
                        </div>
                      </div>
                      {subtopic.courseCount > 0 && (
                        <ChevronRight
                          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${
                            selectedSubtopic === subtopic.id ? 'rotate-90' : ''
                          }`}
                        />
                      )}
                    </button>

                    {/* Expanded Courses */}
                    {selectedSubtopic === subtopic.id && subtopic.courses.length > 0 && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="border-t border-gray-100"
                      >
                        <div className="p-4 space-y-3">
                          {subtopic.courses.map((course) => (
                            <div
                              key={course.id}
                              className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-gray-900 text-sm flex-1 pr-2">
                                  {course.title}
                                </h4>
                                <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                                  course.difficulty === 'Beginner' 
                                    ? 'bg-green-100 text-green-700'
                                    : course.difficulty === 'Intermediate'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {course.difficulty}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mb-2 line-clamp-2">{course.description}</p>
                              <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {course.duration}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {course.enrolledCount} enrolled
                                </span>
                              </div>
                              {/* Show "Try First Course" for the first course in first subtopic, "Enroll Now" for others */}
                              {topic.subtopics.findIndex(st => st.id === subtopic.id) === 0 && 
                               subtopic.courses.findIndex(c => c.id === course.id) === 0 ? (
                                <div className="space-y-2">
                                  <button 
                                    onClick={() => handleTryFirstCourse(course.id)} 
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded text-xs font-medium transition-colors"
                                  >
                                    Try First Course (Free)
                                  </button>
                                  {!isLoggedIn && (
                                    <button 
                                      onClick={handleGetStarted}
                                      className="w-full bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded text-xs font-medium transition-colors"
                                    >
                                      Enroll for Full Access
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <button 
                                  onClick={handleGetStarted}
                                  className="w-full bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded text-xs font-medium transition-colors"
                                >
                                  Enroll Now
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Topic Questions Section - Full Width */}
        <TopicQuestions topicId={params.id as string} />

        {/* Call to Action Section */}
        <section className="mt-12 bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Your Learning Journey?</h2>
          <p className="text-green-100 mb-6 max-w-2xl mx-auto">
            Join thousands of students who have transformed their farming practices 
            with our comprehensive courses.
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-white text-green-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Get Started Today
          </button>
        </section>
      </main>
    </div>
  );
}

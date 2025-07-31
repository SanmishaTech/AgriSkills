'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Play, Clock, Users, Award, ChevronRight, Star } from 'lucide-react';
import Image from 'next/image';

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
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [demoVideos, setDemoVideos] = useState<DemoVideo[]>([]);

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
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch topic details:', error);
        setLoading(false);
      }
    };

    fetchTopicDetails();
  }, [params.id]);

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
        {/* Demo Videos Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Demo Videos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demoVideos.map((video) => (
              <motion.div
                key={video.id}
                whileHover={{ y: -4 }}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="relative aspect-video bg-gray-200">
                  <iframe
                    src={`https://www.youtube.com/embed/${video.youtubeId}`}
                    title={video.title}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{video.title}</h3>
                  <p className="text-sm text-gray-600">by {video.instructor}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Subtopics Section */}
        <section className="mb-12">
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
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">
                      {subtopic.title}
                    </h3>
                    <p className="text-gray-600 text-sm">{subtopic.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {subtopic.courseCount} Courses
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      selectedSubtopic === subtopic.id ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                {/* Expanded Courses */}
                {selectedSubtopic === subtopic.id && subtopic.courses.length > 0 && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="border-t border-gray-100"
                  >
                    <div className="p-6 space-y-4">
                      {subtopic.courses.map((course) => (
                        <div
                          key={course.id}
                          className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900 flex-1">
                              {course.title}
                            </h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              course.difficulty === 'Beginner' 
                                ? 'bg-green-100 text-green-700'
                                : course.difficulty === 'Intermediate'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {course.difficulty}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{course.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {course.duration}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {course.enrolledCount} enrolled
                            </span>
                          </div>
                          <button className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium">
                            Enroll Now
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-green-50 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Master {topic.title}?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Join thousands of students who have transformed their farming practices 
            with our comprehensive courses.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Get Started Today
          </button>
        </section>
      </main>
    </div>
  );
}

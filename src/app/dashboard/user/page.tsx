'use client';
// @ts-nocheck

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  ChevronRight, 
  ChevronDown, 
  Play, 
  Clock, 
  Users, 
  ArrowLeft,
  GraduationCap,
  FileText,
  Star,
  Home,
  Search,
  User,
  Settings,
  Menu,
  Bell,
  LogOut,
  ChevronDown as ChevronDownIcon
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Chapter {
  id: string;
  title: string;
  description?: string;
  content: string;
  youtubeUrl?: string;
  orderIndex: number;
  createdAt: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  duration?: number;
  level?: string;
  isActive: boolean;
  chapters?: Chapter[];
  _count?: {
    chapters: number;
  };
}

interface Subtopic {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  courses: Course[];
  _count: {
    courses: number;
  };
}

interface Topic {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  isActive: boolean;
  subtopics: Subtopic[];
  _count: {
    subtopics: number;
  };
}

type NavigationLevel = 'topics' | 'subtopics' | 'courses' | 'chapters';

interface NavigationState {
  level: NavigationLevel;
  selectedTopic?: Topic;
  selectedSubtopic?: Subtopic;
  selectedCourse?: Course;
  breadcrumb: { label: string; onClick: () => void }[];
}

export default function UserDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [navigation, setNavigation] = useState<NavigationState>({
    level: 'topics',
    breadcrumb: []
  });
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchTopics();
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      console.log('Fetching topics from /api/public/topics');
      const response = await fetch('/api/public/topics');
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Topics data received:', data);
        setTopics(data.topics || []);
      } else {
        const errorData = await response.text();
        console.error('Failed to fetch topics - response:', errorData);
      }
    } catch (error) {
      console.error('Failed to fetch topics - error:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToSubtopics = (topic: Topic) => {
    setNavigation({
      level: 'subtopics',
      selectedTopic: topic,
      breadcrumb: [
        { label: 'Topics', onClick: () => navigateToTopics() },
        { label: topic.title, onClick: () => navigateToSubtopics(topic) }
      ]
    });
  };

  const navigateToCourses = (subtopic: Subtopic) => {
    setNavigation(prev => ({
      level: 'courses',
      selectedTopic: prev.selectedTopic,
      selectedSubtopic: subtopic,
      breadcrumb: [
        { label: 'Topics', onClick: () => navigateToTopics() },
        { label: prev.selectedTopic?.title || '', onClick: () => navigateToSubtopics(prev.selectedTopic!) },
        { label: subtopic.title, onClick: () => navigateToCourses(subtopic) }
      ]
    }));
  };

  const navigateToChapters = async (course: Course) => {
    try {
      setChaptersLoading(true);
      
      // Fetch chapters for this course
      const response = await fetch(`/api/courses/${course.id}/chapters`);
      if (response.ok) {
        const data = await response.json();
        const courseWithChapters = { ...course, chapters: data.course.chapters };
        
        setNavigation(prev => ({
          level: 'chapters',
          selectedTopic: prev.selectedTopic,
          selectedSubtopic: prev.selectedSubtopic,
          selectedCourse: courseWithChapters,
          breadcrumb: [
            { label: 'Topics', onClick: () => navigateToTopics() },
            { label: prev.selectedTopic?.title || '', onClick: () => navigateToSubtopics(prev.selectedTopic!) },
            { label: prev.selectedSubtopic?.title || '', onClick: () => navigateToCourses(prev.selectedSubtopic!) },
            { label: course.title, onClick: () => navigateToChapters(course) }
          ]
        }));
      } else {
        console.error('Failed to fetch chapters');
        // Still navigate but without chapters
        setNavigation(prev => ({
          level: 'chapters',
          selectedTopic: prev.selectedTopic,
          selectedSubtopic: prev.selectedSubtopic,
          selectedCourse: course,
          breadcrumb: [
            { label: 'Topics', onClick: () => navigateToTopics() },
            { label: prev.selectedTopic?.title || '', onClick: () => navigateToSubtopics(prev.selectedTopic!) },
            { label: prev.selectedSubtopic?.title || '', onClick: () => navigateToCourses(prev.selectedSubtopic!) },
            { label: course.title, onClick: () => navigateToChapters(course) }
          ]
        }));
      }
    } catch (error) {
      console.error('Error fetching chapters:', error);
    } finally {
      setChaptersLoading(false);
    }
  };

  const navigateToTopics = () => {
    setNavigation({
      level: 'topics',
      breadcrumb: []
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const renderNavbar = () => {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo/Brand */}
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">AgriSkills</h1>
                <p className="text-xs text-gray-500">Learning Platform</p>
              </div>
            </div>

            {/* Center - Search (on larger screens) */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="search"
                  placeholder="Search courses, topics..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm"
                />
              </div>
            </div>

            {/* Right side - User menu */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                <Bell className="w-5 h-5" />
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 p-2 hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-gray-900">{user?.name || 'User'}</div>
                    <div className="text-xs text-gray-500">{user?.role || 'Student'}</div>
                  </div>
                  <ChevronDownIcon className="w-4 h-4 text-gray-400 hidden md:block" />
                </button>

                {/* Dropdown menu */}
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                  >
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      
                      <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <User className="w-4 h-4 mr-3" />
                        My Profile
                      </button>
                      
                      <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <BookOpen className="w-4 h-4 mr-3" />
                        My Courses
                      </button>
                      
                      <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </button>
                      
                      <div className="border-t border-gray-100">
                        <button 
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  };

  const renderBreadcrumb = () => {
    if (navigation.breadcrumb.length === 0) return null;

    return (
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm">
          {navigation.breadcrumb.map((crumb, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />}
              <button
                onClick={crumb.onClick}
                className={`${
                  index === navigation.breadcrumb.length - 1
                    ? 'text-gray-900 font-medium'
                    : 'text-blue-600 hover:text-blue-800'
                } transition-colors`}
              >
                {crumb.label}
              </button>
            </li>
          ))}
        </ol>
      </nav>
    );
  };

  const renderTopics = () => (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Explore Topics</h2>
        <p className="text-gray-600">Choose a topic to start your learning journey</p>
      </div>
      
      {topics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic, index) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={topic._count.subtopics > 0 ? { y: -4, scale: 1.02 } : {}}
              className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all ${
                topic._count.subtopics > 0 
                  ? 'hover:shadow-lg cursor-pointer' 
                  : 'opacity-75 cursor-not-allowed'
              }`}
              onClick={() => {
                if (topic._count.subtopics > 0) {
                  navigateToSubtopics(topic);
                }
              }}
            >
              {topic.thumbnail ? (
                <div className="h-48 bg-gradient-to-br from-green-400 to-green-600 relative">
                  <img 
                    src={topic.thumbnail} 
                    alt={topic.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20"></div>
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-green-400 to-green-600 relative flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-white/80" />
                </div>
              )}
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{topic.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{topic.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <BookOpen className="w-4 h-4 mr-1" />
                    <span>{topic._count.subtopics} Subtopics</span>
                  </div>
                  {topic._count.subtopics > 0 ? (
                    <ChevronRight className="w-5 h-5 text-green-600" />
                  ) : (
                    <div className="flex flex-col items-end">
                      <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-600 mb-1">
                        Coming Soon
                      </span>
                      <div className="text-xs text-gray-400">Content being prepared</div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Topics Available</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Topics haven't been added yet. Check back later or contact your administrator to add learning content.
          </p>
          <div className="text-sm text-gray-500">
            Debug info: Found {topics.length} topics
          </div>
        </div>
      )}
    </div>
  );

  const renderSubtopics = () => {
    if (!navigation.selectedTopic) return null;

    return (
      <div>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {navigation.selectedTopic.title} Subtopics
          </h2>
          <p className="text-gray-600">Select a subtopic to view available courses</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {navigation.selectedTopic.subtopics.map((subtopic, index) => (
            <motion.div
              key={subtopic.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 p-6 cursor-pointer transition-all"
              onClick={() => navigateToCourses(subtopic)}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">{subtopic.title}</h3>
              <p className="text-gray-600 mb-4 line-clamp-2">{subtopic.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <GraduationCap className="w-4 h-4 mr-1" />
                  <span>{subtopic._count.courses} Courses</span>
                </div>
                {subtopic._count.courses > 0 ? (
                  <ChevronRight className="w-5 h-5 text-green-600" />
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-600">
                    Coming Soon
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const renderCourses = () => {
    if (!navigation.selectedSubtopic) return null;

    return (
      <div>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {navigation.selectedSubtopic.title} Courses
          </h2>
          <p className="text-gray-600">Choose a course to start learning</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navigation.selectedSubtopic.courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-lg shadow-sm hover:shadow-lg border border-gray-200 overflow-hidden cursor-pointer transition-all"
              onClick={() => navigateToChapters(course)}
            >
              <div className="h-32 bg-gradient-to-br from-blue-400 to-blue-600 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900 flex-1 pr-2">{course.title}</h3>
                  {course.level && (
                    <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                      course.level === 'Beginner' 
                        ? 'bg-green-100 text-green-700'
                        : course.level === 'Intermediate'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {course.level}
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  {course.duration && (
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{course.duration} min</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-1" />
                    <span>{course._count?.chapters || 0} Chapters</span>
                  </div>
                </div>
                
                <button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                  Start Course
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const renderChapters = () => {
    if (!navigation.selectedCourse) return null;

    const course = navigation.selectedCourse;
    const chapters = course.chapters || [];

    if (chaptersLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Loading chapters...</span>
        </div>
      );
    }

    return (
      <div>
        {/* Course Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl p-8">
            <h2 className="text-3xl font-bold mb-2">{course.title}</h2>
            <p className="text-green-100 mb-4">{course.description}</p>
            <div className="flex items-center gap-6 text-sm">
              {course.level && (
                <div className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4" />
                  <span>Level: {course.level}</span>
                </div>
              )}
              {course.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{course.duration} minutes</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>{chapters.length} Chapters</span>
              </div>
            </div>
          </div>
        </div>

        {chapters.length > 0 ? (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Course Content</h3>
            {chapters.map((chapter, index) => (
              <motion.div
                key={chapter.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Chapter Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 text-sm font-medium">
                          {index + 1}
                        </span>
                        <h4 className="text-lg font-semibold text-gray-900">{chapter.title}</h4>
                      </div>
                      {chapter.description && (
                        <p className="text-gray-600 ml-11">{chapter.description}</p>
                      )}
                    </div>
                    {chapter.youtubeUrl && (
                      <div className="flex items-center gap-1 text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full">
                        <Play className="w-4 h-4" />
                        <span>Video</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chapter Content */}
                <div className="p-6">
                  {chapter.youtubeUrl && (
                    <div className="mb-6">
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <iframe
                          src={`https://www.youtube.com/embed/${chapter.youtubeUrl.split('/').pop()?.split('?')[0] || chapter.youtubeUrl.split('watch?v=')[1]?.split('&')[0]}?rel=0&modestbranding=1`}
                          title={chapter.title}
                          className="w-full h-full"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    </div>
                  )}
                  
                  {chapter.content && (
                    <div 
                      className="prose prose-green max-w-none"
                      dangerouslySetInnerHTML={{ __html: chapter.content }}
                    />
                  )}
                  
                  {/* Chapter Actions */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Chapter {index + 1} of {chapters.length}
                      </span>
                      <div className="flex items-center gap-2">
                        {index > 0 && (
                          <button className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded border transition-colors">
                            Previous
                          </button>
                        )}
                        {index < chapters.length - 1 && (
                          <button className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors">
                            Next Chapter
                          </button>
                        )}
                        {index === chapters.length - 1 && (
                          <button className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors">
                            Complete Course
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Chapters Available</h3>
            <p className="text-gray-600 mb-6">
              This course doesn't have any chapters yet. Content will be added soon.
            </p>
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Notify Me When Available
            </button>
          </div>
        )}
      </div>
    );
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top Navbar */}
      {renderNavbar()}
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {navigation.level !== 'topics' && (
          <button
            onClick={navigateToTopics}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Topics
          </button>
        )}
        
        {renderBreadcrumb()}
        
        <AnimatePresence mode="wait">
          <motion.div
            key={navigation.level}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {navigation.level === 'topics' && renderTopics()}
            {navigation.level === 'subtopics' && renderSubtopics()}
            {navigation.level === 'courses' && renderCourses()}
            {navigation.level === 'chapters' && renderChapters()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-md mx-auto">
          <div className="flex justify-around items-center py-2">
            {/* Home */}
            <button 
              onClick={navigateToTopics}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                navigation.level === 'topics'
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
              }`}
            >
              <Home className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Home</span>
            </button>

            {/* Search */}
            <button className="flex flex-col items-center py-2 px-3 rounded-lg transition-colors text-gray-600 hover:text-green-600 hover:bg-gray-50">
              <Search className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Search</span>
            </button>

            {/* Courses */}
            <button 
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                navigation.level === 'courses' || navigation.level === 'chapters'
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
              }`}
            >
              <BookOpen className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Courses</span>
            </button>

            {/* Profile */}
            <button className="flex flex-col items-center py-2 px-3 rounded-lg transition-colors text-gray-600 hover:text-green-600 hover:bg-gray-50">
              <User className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Profile</span>
            </button>

            {/* Menu */}
            <button className="flex flex-col items-center py-2 px-3 rounded-lg transition-colors text-gray-600 hover:text-green-600 hover:bg-gray-50">
              <Menu className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Menu</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}

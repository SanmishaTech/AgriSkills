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
  LogOut,
  ChevronDown as ChevronDownIcon,
  Package,
  Plus,
  Edit,
  Trash2,
  X,
  HelpCircle
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
  quizPassed?: boolean;
  quizScore?: number;
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

interface LearningPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in days
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [packages, setPackages] = useState<LearningPackage[]>([]);
  const [packageModalMode, setPackageModalMode] = useState<'list' | 'add' | 'edit'>('list');
  const [selectedPackage, setSelectedPackage] = useState<LearningPackage | null>(null);
  const [packageForm, setPackageForm] = useState({
    name: '',
    description: '',
    price: 0,
    duration: 30,
    features: [''],
    isActive: true
  });
  const [quizStatuses, setQuizStatuses] = useState<Record<string, { passed: boolean; score?: number; attemptDate?: string }>>({});
  // Show only a few topics first, reveal all on demand
  const [showAllTopics, setShowAllTopics] = useState(false);
  const router = useRouter();

  // Topic Questions modal state
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [selectedTopicForQuestions, setSelectedTopicForQuestions] = useState<Topic | null>(null);
  const [topicQuestions, setTopicQuestions] = useState<{ id: string; question: string }[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    console.log('User Dashboard Auth Check:', {
      hasToken: !!token,
      hasUserData: !!userData,
      tokenPreview: token ? token.substring(0, 20) + '...' : null
    });
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchTopics();
    } else {
      console.log('Missing auth, redirecting to login');
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
        const chapters = data.course.chapters;
        
        // Check quiz pass status for all chapters
        let courseWithChapters = { ...course, chapters };
        const chapterIds = chapters.map((ch: Chapter) => ch.id);
        if (chapterIds.length > 0) {
          const token = localStorage.getItem('token');
          const statusResponse = await fetch('/api/quiz/check-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ chapterIds })
          });
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            setQuizStatuses(statusData.statusMap);
            
            // Add quiz status to each chapter
            const chaptersWithStatus = chapters.map((ch: Chapter) => ({
              ...ch,
              quizPassed: statusData.statusMap[ch.id]?.passed || false,
              quizScore: statusData.statusMap[ch.id]?.score
            }));
            
            courseWithChapters = { ...course, chapters: chaptersWithStatus };
          }
        }
        
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

  // Package Management Functions
  const openPackageModal = () => {
    setShowPackageModal(true);
    setPackageModalMode('list');
    setShowUserMenu(false);
    loadPackages();
  };

  const closePackageModal = () => {
    setShowPackageModal(false);
    setPackageModalMode('list');
    setSelectedPackage(null);
    resetPackageForm();
  };

  const resetPackageForm = () => {
    setPackageForm({
      name: '',
      description: '',
      price: 0,
      duration: 30,
      features: [''],
      isActive: true
    });
  };

  const loadPackages = async () => {
    // Mock data - in a real app, this would fetch from an API
    const mockPackages: LearningPackage[] = [
      {
        id: '1',
        name: 'Basic Learning Package',
        description: 'Perfect for beginners starting their agricultural journey',
        price: 49.99,
        duration: 30,
        features: ['Access to 10 courses', 'Basic support', '30-day access'],
        isActive: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      },
      {
        id: '2',
        name: 'Premium Learning Package',
        description: 'Comprehensive package for serious learners',
        price: 99.99,
        duration: 90,
        features: ['Access to all courses', 'Priority support', '90-day access', 'Certificates'],
        isActive: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }
    ];
    setPackages(mockPackages);
  };

  const addPackage = () => {
    setPackageModalMode('add');
    resetPackageForm();
  };

  const editPackage = (pkg: LearningPackage) => {
    setSelectedPackage(pkg);
    setPackageModalMode('edit');
    setPackageForm({
      name: pkg.name,
      description: pkg.description,
      price: pkg.price,
      duration: pkg.duration,
      features: pkg.features,
      isActive: pkg.isActive
    });
  };

  const deletePackage = (packageId: string) => {
    setPackages(prev => prev.filter(pkg => pkg.id !== packageId));
  };

  const savePackage = () => {
    if (packageModalMode === 'add') {
      const newPackage: LearningPackage = {
        id: Date.now().toString(),
        name: packageForm.name,
        description: packageForm.description,
        price: packageForm.price,
        duration: packageForm.duration,
        features: packageForm.features.filter(f => f.trim() !== ''),
        isActive: packageForm.isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setPackages(prev => [...prev, newPackage]);
    } else if (packageModalMode === 'edit' && selectedPackage) {
      const updatedPackage: LearningPackage = {
        ...selectedPackage,
        name: packageForm.name,
        description: packageForm.description,
        price: packageForm.price,
        duration: packageForm.duration,
        features: packageForm.features.filter(f => f.trim() !== ''),
        isActive: packageForm.isActive,
        updatedAt: new Date().toISOString()
      };
      setPackages(prev => prev.map(pkg => pkg.id === selectedPackage.id ? updatedPackage : pkg));
    }
    setPackageModalMode('list');
    resetPackageForm();
    setSelectedPackage(null);
  };

  const addFeature = () => {
    setPackageForm(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setPackageForm(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }));
  };

  const removeFeature = (index: number) => {
    setPackageForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  // Topic Questions handlers
  const openTopicQuestions = async (topic: Topic) => {
    try {
      setSelectedTopicForQuestions(topic);
      setShowQuestionsModal(true);
      setQuestionsLoading(true);

      // Preload any saved selections
      const saved = localStorage.getItem(`topic-questions-${topic.id}`);
      if (saved) {
        try {
          setSelectedQuestionIds(new Set(JSON.parse(saved)));
        } catch {}
      } else {
        setSelectedQuestionIds(new Set());
      }

      const res = await fetch(`/api/topics/${topic.id}/questions`);
      if (res.ok) {
        const data = await res.json();
        setTopicQuestions((data.questions || []).map((q: any) => ({ id: q.id, question: q.question })));
      } else {
        setTopicQuestions([]);
      }
    } catch (e) {
      console.error('Failed to open topic questions:', e);
      setTopicQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const toggleQuestionSelection = (id: string) => {
    setSelectedQuestionIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const closeTopicQuestionsModal = () => {
    setShowQuestionsModal(false);
    setSelectedTopicForQuestions(null);
    setTopicQuestions([]);
    setSelectedQuestionIds(new Set());
  };

  const proceedAfterQuestions = () => {
    if (selectedTopicForQuestions) {
      // Persist locally for now
      try {
        localStorage.setItem(
          `topic-questions-${selectedTopicForQuestions.id}`,
          JSON.stringify(Array.from(selectedQuestionIds))
        );
      } catch {}

      const topic = selectedTopicForQuestions;
      closeTopicQuestionsModal();
      if (topic._count.subtopics > 0) {
        navigateToSubtopics(topic);
      }
    }
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
                      
                      <button
                        onClick={() => { setShowUserMenu(false); router.push('/profile'); }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <User className="w-4 h-4 mr-3" />
                        My Profile
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Choose one topics you are interested in</h2>
      </div>

      {topics.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {(showAllTopics ? topics : topics.slice(0, 6)).map((topic, index) => (
              <motion.button
                key={topic.id}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (index % 6) * 0.05 }}
                onClick={() => openTopicQuestions(topic)}
                className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col items-center justify-center hover:shadow-md active:scale-[0.99] transition`}
              >
                {topic.thumbnail ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden mb-2 border border-gray-100 bg-gray-50 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={topic.thumbnail}
                      alt={topic.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // If image fails to load, fall back to contain to avoid layout break
                        (e.currentTarget as HTMLImageElement).style.objectFit = 'contain';
                      }}
                    />
                  </div>
                ) : (
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center mb-2 ${[
                      'bg-emerald-50 text-emerald-600',
                      'bg-sky-50 text-sky-700',
                      'bg-amber-50 text-amber-600',
                      'bg-rose-50 text-rose-600',
                      'bg-orange-50 text-orange-600',
                      'bg-fuchsia-50 text-fuchsia-600'
                    ][index % 6]}`}
                  >
                    <BookOpen className="w-6 h-6" />
                  </div>
                )}
                <span className="text-sm font-semibold text-gray-800 text-center leading-tight">
                  {topic.title}
                </span>
              </motion.button>
            ))}
          </div>

          {!showAllTopics && topics.length > 6 && (
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setShowAllTopics(true)}
                className="text-gray-800 underline font-medium"
              >
                View More
              </button>
            </div>
          )}
        </>
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

                {/* Chapter Actions */}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Chapter {index + 1} of {chapters.length}
                    </span>
                    <div className="flex items-center gap-2">
                      {/* Learn Button */}
                      <button 
                        onClick={() => router.push(`/learn/${chapter.id}`)}
                        className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors flex items-center gap-1"
                      >
                        <BookOpen className="w-4 h-4" />
                        Learn
                      </button>
                      
                      {/* Quiz Button - Show different states based on pass status */}
                      {chapter.quizPassed ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Passed {chapter.quizScore && `(${chapter.quizScore}%)`}
                          </span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                            const token = localStorage.getItem('token');
                            const userData = localStorage.getItem('user');
                            console.log('Dashboard Quiz Button Click:', {
                              hasToken: !!token,
                              hasUserData: !!userData,
                              navigatingTo: `/quiz/${chapter.id}`
                            });
                            router.push(`/quiz/${chapter.id}`);
                          }}
                          className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors flex items-center gap-1"
                        >
                          <HelpCircle className="w-4 h-4" />
                          Take Quiz
                        </button>
                      )}
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
      
      {/* Topic Questions Modal */}
      <AnimatePresence>
        {showQuestionsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => e.target === e.currentTarget && closeTopicQuestionsModal()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedTopicForQuestions ? `Questions about ${selectedTopicForQuestions.title}` : 'Topic Questions'}
                  </h2>
                </div>
                <button
                  onClick={closeTopicQuestionsModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                {questionsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : topicQuestions.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-gray-600">Select one or more that match your needs.</p>
                    <div className="space-y-3">
                      {topicQuestions.map((q) => (
                        <label
                          key={q.id}
                          className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="mt-1 w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                            checked={selectedQuestionIds.has(q.id)}
                            onChange={() => toggleQuestionSelection(q.id)}
                          />
                          <span className="text-gray-800">{q.question}</span>
                        </label>
                      ))}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={closeTopicQuestionsModal}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={proceedAfterQuestions}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Save & Next
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Available</h3>
                    <p className="text-gray-600 mb-6">You can continue exploring subtopics for this topic.</p>
                    <button
                      type="button"
                      onClick={proceedAfterQuestions}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      Continue
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Package Management Modal */}
      <AnimatePresence>
        {showPackageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => e.target === e.currentTarget && closePackageModal()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Package className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl font-bold text-gray-900">
                    {packageModalMode === 'list' ? 'Learning Packages' : 
                     packageModalMode === 'add' ? 'Add New Package' : 'Edit Package'}
                  </h2>
                </div>
                <button
                  onClick={closePackageModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                {packageModalMode === 'list' && (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <p className="text-gray-600">Manage your learning packages</p>
                      <button
                        onClick={addPackage}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Package
                      </button>
                    </div>

                    {packages.length > 0 ? (
                      <div className="space-y-4">
                        {packages.map((pkg, index) => (
                          <motion.div
                            key={pkg.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-bold text-gray-900">{pkg.name}</h3>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    pkg.isActive 
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {pkg.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                                <p className="text-gray-600 mb-3">{pkg.description}</p>
                                <div className="flex items-center gap-6 text-sm text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">Price:</span>
                                    <span>${pkg.price}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">Duration:</span>
                                    <span>{pkg.duration} days</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">Features:</span>
                                    <span>{pkg.features.length} items</span>
                                  </div>
                                </div>
                                <div className="mt-3">
                                  <p className="text-sm font-medium text-gray-700 mb-1">Features:</p>
                                  <ul className="text-sm text-gray-600">
                                    {pkg.features.slice(0, 3).map((feature, idx) => (
                                      <li key={idx} className="flex items-center gap-1">
                                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                        {feature}
                                      </li>
                                    ))}
                                    {pkg.features.length > 3 && (
                                      <li className="text-gray-500 italic">+{pkg.features.length - 3} more</li>
                                    )}
                                  </ul>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <button
                                  onClick={() => editPackage(pkg)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit Package"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deletePackage(pkg.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Package"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Packages Yet</h3>
                        <p className="text-gray-600 mb-6">Create your first learning package to get started.</p>
                        <button
                          onClick={addPackage}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                          Add Your First Package
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {(packageModalMode === 'add' || packageModalMode === 'edit') && (
                  <div className="p-6">
                    <div className="space-y-6">
                      {/* Package Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Package Name *
                        </label>
                        <input
                          type="text"
                          value={packageForm.name}
                          onChange={(e) => setPackageForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Enter package name"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description *
                        </label>
                        <textarea
                          value={packageForm.description}
                          onChange={(e) => setPackageForm(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Describe this package"
                        />
                      </div>

                      {/* Price and Duration */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price ($) *
                          </label>
                          <input
                            type="number"
                            value={packageForm.price}
                            onChange={(e) => setPackageForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                            min="0"
                            step="0.01"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Duration (days) *
                          </label>
                          <input
                            type="number"
                            value={packageForm.duration}
                            onChange={(e) => setPackageForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                            min="1"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="30"
                          />
                        </div>
                      </div>

                      {/* Features */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Package Features *
                          </label>
                          <button
                            type="button"
                            onClick={addFeature}
                            className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" />
                            Add Feature
                          </button>
                        </div>
                        <div className="space-y-2">
                          {packageForm.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={feature}
                                onChange={(e) => updateFeature(index, e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="Enter feature description"
                              />
                              {packageForm.features.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeFeature(index)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Active Status */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={packageForm.isActive}
                          onChange={(e) => setPackageForm(prev => ({ ...prev, isActive: e.target.checked }))}
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                          Package is active and available for purchase
                        </label>
                      </div>

                      {/* Form Actions */}
                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => setPackageModalMode('list')}
                          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={savePackage}
                          disabled={!packageForm.name || !packageForm.description || packageForm.features.every(f => !f.trim())}
                          className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                        >
                          {packageModalMode === 'add' ? 'Create Package' : 'Update Package'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

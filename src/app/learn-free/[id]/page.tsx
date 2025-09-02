'use client';
// Added hydration mismatch handling to prevent Error #418

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Clock, Play, FileText, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface DemoVideo {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  duration?: number;
  thumbnailUrl?: string;
}

interface Section {
  id: string;
  title: string;
  content: string;
  orderIndex: number;
}

interface Chapter {
  id: string;
  title: string;
  description?: string;
  content: string;
  youtubeUrl?: string;
  orderIndex: number;
  demoVideos: DemoVideo[];
  sections: Section[];
  course: {
    id: string;
    title: string;
    description?: string;
  };
}

export default function LearnFreePage() {
  const params = useParams();
  const router = useRouter();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);

  useEffect(() => {
    fetchFreeChapters();
  }, [params.id]);

  // Fix for hydration mismatch (Error #418)
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const fetchFreeChapters = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${params.id}/chapters/free`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.chapters && data.chapters.length > 0) {
          setChapters(data.chapters);
          setCurrentChapter(data.chapters[0]);
        } else {
          setError('No free chapters available for this course');
        }
      } else if (response.status === 403) {
        setError('This course is not available for free preview');
      } else {
        setError('Failed to load course content');
      }
    } catch (error) {
      console.error('Error fetching free chapters:', error);
      setError('Failed to load course content');
    } finally {
      setLoading(false);
    }
  };


  const extractYouTubeId = (url: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const handleChapterChange = (index: number) => {
    setCurrentChapterIndex(index);
    setCurrentChapter(chapters[index]);
  };

  // Prevent hydration mismatch by not rendering until client-side mount
  if (!hasMounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Not Available</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!currentChapter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Content Available</h2>
          <p className="text-gray-600 mb-4">This course doesn't have any available content.</p>
          <button
            onClick={() => router.back()}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mr-6"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-green-600" />
                <div>
                  <h1 className="text-lg font-bold text-gray-900">{currentChapter.course.title}</h1>
                  <p className="text-xs text-blue-600 font-medium">Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>


      {/* Chapter Navigation */}
      {chapters.length > 1 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Available Chapters:</h3>
            <div className="flex flex-wrap gap-2">
              {chapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  onClick={() => handleChapterChange(index)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    index === currentChapterIndex
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}. {chapter.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chapter Header with Details */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-3">{currentChapter.title}</h1>
          {currentChapter.description && (
            <p className="text-green-100 mb-4 text-lg">{currentChapter.description}</p>
          )}
          
          <div className="flex items-center gap-6 text-sm">
            {currentChapter.demoVideos?.length > 0 && (
              <div className="flex items-center gap-1">
                <Play className="w-4 h-4" />
                <span>{currentChapter.demoVideos.length} Demo Videos</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* YouTube Video - Show first if available */}
        {currentChapter.youtubeUrl && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">Video Lesson</h2>
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${extractYouTubeId(currentChapter.youtubeUrl)}?rel=0&modestbranding=1`}
                title={currentChapter.title}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}

        {/* Chapter Content */}
        {currentChapter.content && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">Chapter Content</h2>
            <div
              className="prose prose-green max-w-none"
              dangerouslySetInnerHTML={{ __html: currentChapter.content }}
            />
          </div>
        )}

        {/* Demo Videos */}
        {currentChapter.demoVideos && currentChapter.demoVideos.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4">Demo Videos</h2>
            <div className="space-y-6">
              {currentChapter.demoVideos.map((video, index) => (
                <div
                  key={video.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {index + 1}. {video.title}
                        </h3>
                        {video.description && (
                          <p className="text-gray-600">{video.description}</p>
                        )}
                      </div>
                      {video.duration && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <iframe
                        src={`https://www.youtube.com/embed/${extractYouTubeId(video.videoUrl)}?rel=0&modestbranding=1`}
                        title={video.title}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation and Quiz Button */}
        <div className="mt-8 flex items-center justify-end">
          
          <div className="flex items-center gap-4">
            {/* Chapter Navigation */}
            {chapters.length > 1 && (
              <div className="flex items-center gap-2">
                {currentChapterIndex > 0 && (
                  <button
                    onClick={() => handleChapterChange(currentChapterIndex - 1)}
                    className="flex items-center gap-1 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg border transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </button>
                )}
                {currentChapterIndex < chapters.length - 1 && (
                  <button
                    onClick={() => handleChapterChange(currentChapterIndex + 1)}
                    className="flex items-center gap-1 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg border transition-colors"
                  >
                    Next
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => router.push(`/quiz-free/${currentChapter.id}`)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Quiz
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}

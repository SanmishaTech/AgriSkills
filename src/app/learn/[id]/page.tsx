'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Play } from 'lucide-react';

interface DemoVideo {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  duration?: number;
  thumbnailUrl?: string;
}

interface Chapter {
  id: string;
  title: string;
  description?: string;
  content: string;
  youtubeUrl?: string;
  orderIndex: number;
  demoVideos: DemoVideo[];
  course: {
    id: string;
    title: string;
    description?: string;
  };
}

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChapterDetails();
  }, [params.id]);

  const fetchChapterDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/chapters/${params.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setChapter(data.chapter);
      } else {
        console.error('Failed to fetch chapter details');
      }
    } catch (error) {
      console.error('Error fetching chapter:', error);
    } finally {
      setLoading(false);
    }
  };


  const extractYouTubeId = (url: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Chapter Not Found</h2>
          <p className="text-gray-600 mb-4">The chapter you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/dashboard/user')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Back to Dashboard
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
                onClick={() => router.push('/dashboard/user')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mr-6"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </button>
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-lg font-bold text-gray-900">{chapter.course.title}</h1>
                  <p className="text-xs text-gray-500">Learning Mode</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chapter Header with Details */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-3">{chapter.title}</h1>
          {chapter.description && (
            <p className="text-green-100 mb-4 text-lg">{chapter.description}</p>
          )}
          
          <div className="flex items-center gap-6 text-sm">
            {chapter.demoVideos?.length > 0 && (
              <div className="flex items-center gap-1">
                <Play className="w-4 h-4" />
                <span>{chapter.demoVideos.length} Demo Videos</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* YouTube Video - Show first if available */}
        {chapter.youtubeUrl && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">Video Lesson</h2>
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${extractYouTubeId(chapter.youtubeUrl)}?rel=0&modestbranding=1`}
                title={chapter.title}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}

        {/* Chapter Content - moved below the video */}
        {chapter.content && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">Chapter Content</h2>
            <div
              className="prose prose-green max-w-none"
              dangerouslySetInnerHTML={{ __html: chapter.content }}
            />
          </div>
        )}

        {/* Demo Videos */}
        {chapter.demoVideos?.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-6">Demo Videos</h2>
              <div className="space-y-6">
                {chapter.demoVideos.map((video, index) => (
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
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard/user')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </button>
          
          <button
            onClick={() => router.push(`/quiz/${params.id}`)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Take Quiz
          </button>
        </div>
      </main>
    </div>
  );
}

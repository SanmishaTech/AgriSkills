'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, BookOpen, Play, Clock, Users, Award, Star, Youtube } from 'lucide-react';

interface ChapterPreview {
  title: string;
  description: string;
  content: string;
  youtubeUrl?: string;
  isActive: boolean;
  subtopicId: string;
  subtopicTitle?: string;
  topicTitle?: string;
}

// Component that uses search params - must be wrapped in Suspense
function ChapterPreviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [chapterData, setChapterData] = useState<ChapterPreview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get chapter data from URL parameters
    const title = searchParams.get('title') || '';
    const description = searchParams.get('description') || '';
    const content = searchParams.get('content') || '';
    const youtubeUrl = searchParams.get('youtubeUrl') || '';
    const isActive = searchParams.get('isActive') === 'true';
    const subtopicId = searchParams.get('subtopicId') || '';
    const subtopicTitle = searchParams.get('subtopicTitle') || 'Subtopic';
    const topicTitle = searchParams.get('topicTitle') || 'Topic';

    if (title || content) {
      setChapterData({
        title,
        description,
        content,
        youtubeUrl,
        isActive,
        subtopicId,
        subtopicTitle,
        topicTitle
      });
    }
    setLoading(false);
  }, [searchParams]);

  const getYoutubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const regex = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&\?]*).*/;
    const match = url.match(regex);
    return (match && match[1].length === 11) ? match[1] : null;
  };

  const stripHtmlTags = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  const convertYoutubeLinksToPlayers = (content: string): string => {
    if (!content) return content;
    
    // Match YouTube URLs including any HTML attributes or text that might follow
    // This regex captures the video ID and consumes the entire YouTube link including any trailing attributes
    const youtubeRegex = /(?:<a[^>]*href=["'])?(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})[^<\s]*(?:[^<]*<\/a>)?/gi;
    
    // Replace YouTube URLs with embedded iframes
    let processedContent = content.replace(youtubeRegex, (match, videoId) => {
      return `
        <div style="margin: 20px 0;">
          <div style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 12px;">
            <iframe 
              src="https://www.youtube.com/embed/${videoId}" 
              title="YouTube video player" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowfullscreen
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;">
            </iframe>
          </div>
        </div>
      `;
    });
    
    // Clean up any remaining broken HTML or text patterns that look like YouTube metadata
    processedContent = processedContent.replace(/" rel="[^"]*" target="[^"]*">.*?- YouTube/gi, '');
    processedContent = processedContent.replace(/\s*-\s*YouTube\s*/gi, ' ');
    
    return processedContent;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!chapterData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No chapter data found</p>
          <button
            onClick={() => router.back()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
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
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Form</span>
          </button>
          
          <div className="flex items-start gap-6">
            <div className="text-6xl">📚</div>
            <div className="flex-1">
              <div className="mb-2">
                <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                  PREVIEW MODE
                </span>
              </div>
              <h1 className="text-3xl font-bold mb-2">{chapterData.title || 'Chapter Title'}</h1>
              {chapterData.description && (
                <p className="text-white/90 text-lg mb-4">{chapterData.description}</p>
              )}
              
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{chapterData.topicTitle} › {chapterData.subtopicTitle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>0 Students Enrolled</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-current" />
                  <span>New Chapter</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span className={chapterData.isActive ? 'text-green-200' : 'text-red-200'}>
                    {chapterData.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-4xl">
          {/* YouTube Video Section */}
          {chapterData.youtubeUrl && (
            <section className="mb-8">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="aspect-video">
                  {(() => {
                    const videoId = getYoutubeVideoId(chapterData.youtubeUrl);
                    return videoId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title="Chapter Video"
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <div className="text-center">
                          <Youtube className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">Invalid YouTube URL</p>
                        </div>
                      </div>
                    );
                  })()
                  }
                </div>
              </div>
            </section>
          )}
          {/* Chapter Content */}
          <section className="mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Chapter Content</h2>
              <div className="prose max-w-none">
                {chapterData.content ? (
                  <div dangerouslySetInnerHTML={{ __html: convertYoutubeLinksToPlayers(chapterData.content) }} />
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No content available yet</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// Loading component for Suspense fallback
function ChapterPreviewLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );
}

// Main component with Suspense wrapper
export default function ChapterPreviewPage() {
  return (
    <Suspense fallback={<ChapterPreviewLoading />}>
      <ChapterPreviewContent />
    </Suspense>
  );
}

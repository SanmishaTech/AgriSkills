'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import FullScreenDemoPlayer from '@/components/FullScreenDemoPlayer';

interface Subtopic {
  id: string;
  title: string;
  _count?: { courses: number };
}

interface Topic {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  subtopics?: Subtopic[];
  _count?: { subtopics: number };
}

export default function LearnPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Demo player state
  const [showDemoPlayer, setShowDemoPlayer] = useState(false);
  const [demoUrls, setDemoUrls] = useState<string[]>([]);
  const [demoTitles, setDemoTitles] = useState<string[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await fetch('/api/public/topics');
        if (!res.ok) throw new Error('Failed to load topics');
        const data = await res.json();
        setTopics(Array.isArray(data?.topics) ? data.topics : []);
      } catch (e: any) {
        setError(e?.message || 'Something went wrong while fetching topics');
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, []);

  const openTopicDemo = async (topicId: string) => {
    try {
      const res = await fetch(`/api/topics/${topicId}`);
      if (!res.ok) {
        router.push(`/topic/${topicId}`);
        return;
      }
      const data = await res.json();
      const demoPairs = Array.isArray(data?.demoVideos)
        ? data.demoVideos
            .map((v: any) => ({
              youtubeId: v?.youtubeId,
              title: typeof v?.title === 'string' ? v.title : ''
            }))
            .filter((p: any) => typeof p.youtubeId === 'string' && p.youtubeId.length === 11)
        : [];
      const urls: string[] = demoPairs.map((p: any) => `https://www.youtube.com/watch?v=${p.youtubeId}`);
      const titles: string[] = demoPairs.map((p: any) => p.title);

      if (urls.length > 0) {
        setSelectedTopicId(topicId);
        setDemoUrls(urls);
        setDemoTitles(titles);
        setShowDemoPlayer(true);
      } else {
        router.push(`/topic/${topicId}`);
      }
    } catch (e) {
      router.push(`/topic/${topicId}`);
    }
  };

  const closeDemo = () => {
    setShowDemoPlayer(false);
    setDemoUrls([]);
    setDemoTitles([]);
    setSelectedTopicId(null);
  };

  // Helpers for placeholder look & feel
  const getTopicColor = (index: number) => {
    const colors = ['bg-green-100', 'bg-amber-100', 'bg-red-100', 'bg-blue-100', 'bg-yellow-100', 'bg-purple-100'];
    return colors[index % colors.length];
  };
  const getTopicIcon = (index: number) => {
    const icons = ['🌾', '🌱', '🐛', '💧', '🚜', '📊'];
    return icons[index % icons.length];
  };

  return (
    <div className="min-h-screen bg-amber-50 pb-24">
      <div className="max-w-3xl mx-auto px-4 pt-5">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Learn</h1>
        <p className="text-gray-700 mb-6">Browse topics and watch short demo lessons. Tap a topic to start.</p>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-600">Loading topics...</div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        ) : topics.length === 0 ? (
          <div className="text-gray-500">No topics available yet.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {topics.map((topic, index) => (
              <div
                key={topic.id}
                className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openTopicDemo(topic.id)}
              >
                {topic.thumbnail ? (
                  <div className="relative h-24 w-full">
                    <Image
                      src={topic.thumbnail}
                      alt={topic.title}
                      layout="fill"
                      objectFit="cover"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className={`relative h-24 w-full ${getTopicColor(index)} flex items-center justify-center`}>
                    <div className="text-3xl">{getTopicIcon(index)}</div>
                  </div>
                )}
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">{topic.title}</h3>
                  <p className="text-gray-600 text-xs line-clamp-2">
                    {topic.description || `Learn essential skills and techniques in ${topic.title.toLowerCase()}.`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDemoPlayer && (
        <FullScreenDemoPlayer
          demoUrls={demoUrls}
          demoTitles={demoTitles}
          onClose={closeDemo}
          topicId={selectedTopicId || ''}
        />
      )}
    </div>
  );
}

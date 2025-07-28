'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Home, Search, BookOpen, Play, Globe, Menu, Smile, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { LanguageIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/solid';

export default function HomePage() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState('home');

  const circularMenuItems = [
    { id: 1, label: 'ENGAGE', color: '#22c55e', icon: '👥' },
    { id: 2, label: 'FOOD', color: '#eab308', icon: '🍽️' },
    { id: 3, label: 'TRADE', color: '#f97316', icon: '📊' },
    { id: 4, label: 'LEARN', color: '#3b82f6', icon: '📚' },
    { id: 5, label: 'PROFIT', color: '#a855f7', icon: '💰' },
    { id: 6, label: 'TECH', color: '#ec4899', icon: '💻' },
  ];

  const videos = [
    {
      id: 1,
      title: 'Natural Pest Control',
      duration: '3 mins',
      instructor: 'Hari Jas',
      bgColor: '#fbbf24',
    },
    {
      id: 2,
      title: 'Packaging Produce',
      duration: '4 mins',
      instructor: 'Sri Karan',
      bgColor: '#fb923c',
    },
    {
      id: 3,
      title: 'Vegetable Growing',
      duration: '5 mins',
      instructor: 'Maya',
      bgColor: '#a78bfa',
    },
  ];

  const calculatePosition = (index: number, total: number) => {
    const angle = (index * 360) / total - 90; // Start from top
    const radius = 120;
    const x = radius * Math.cos((angle * Math.PI) / 180);
    const y = radius * Math.sin((angle * Math.PI) / 180);
    return { x, y };
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative overflow-hidden">
      
      <header className="text-white p-4 flex items-center justify-between relative overflow-hidden flex-shrink-0"
        style={{
          background: 'linear-gradient(to bottom, #008C45 50%, #00B68A 100%)'
        }}
      >
      
        <Image 
          src="/images/logo.png" 
          alt="AgriSkills Logo" 
          width={55}
          height={55}
          className="object-contain [filter:drop-shadow(0_10px_8px_rgba(0,0,0,0.4))]"
        />
        
        <h1 className="text-[17px] font-bold tracking-wider">LOGIN/ SIGN UP</h1>
        
                <div className="bg-yellow-200 rounded-md p-1 flex items-center border border-transparent">
                    <button 
            className="bg-transparent text-black p-1 rounded-l hover:bg-black/10 transition-colors"
            title="Language Translator"
            onClick={() => alert('Language translator feature coming soon!')}
          >
            <LanguageIcon className="h-5 w-5" />
          </button>
                    <div className="w-px h-5 bg-gray-500/50"></div>
          <button 
            className="bg-transparent text-black p-1 rounded-r hover:bg-black/10 transition-colors"
            title="Help & Support"
            onClick={() => alert('Help & Support section coming soon!')}
          >
            <QuestionMarkCircleIcon className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
         

        <motion.div 
          className="relative group cursor-pointer mx-4 mt-6 h-60 rounded-xl overflow-hidden shadow-lg bg-gray-900"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push('/learn-more')}
        >
          <Image
            src="/images/image1.png"
            alt="Sustainable Farming Techniques"
            layout="fill"
            objectFit="cover"
            className="group-hover:scale-110 transition-transform duration-500 ease-in-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
          <div className="absolute inset-0 p-6 flex flex-col justify-end">
            <h3 className="text-white text-2xl font-bold">Master Sustainable Farming</h3>
            <p className="text-gray-300 mt-1">Unlock the secrets to a greener, more profitable harvest.</p>
            <div className="flex items-center mt-4 text-green-400 font-semibold text-sm">
              <span>Learn More</span>
              <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </motion.div>

        <div className="px-4 pb-24">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Videos</h2>
            <button className="text-green-600 text-sm font-medium">View More</button>
          </div>

          <div className="space-y-3">
            {videos.map((video) => (
              <motion.div
                key={video.id}
                className="relative rounded-lg overflow-hidden shadow-md cursor-pointer"
                style={{ backgroundColor: video.bgColor }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">{video.title}</h3>
                    <p className="text-white/80 text-sm">
                      {video.instructor} · {video.duration}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Play className="w-6 h-6 text-white fill-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex-shrink-0">
        <div className="flex justify-around items-center py-3">
          <button
            onClick={() => setActiveNav('home')}
            className={`flex flex-col items-center p-2 transition-colors ${activeNav === 'home' ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Home</span>
          </button>
          <button
            onClick={() => setActiveNav('search')}
            className={`flex flex-col items-center p-2 transition-colors ${activeNav === 'search' ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Search className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Search</span>
          </button>
          <button
            onClick={() => setActiveNav('learn')}
            className={`flex flex-col items-center p-2 transition-colors ${activeNav === 'learn' ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <BookOpen className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Learn</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

  const handleNavigation = (path: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      router.push(path);
    }, 800);
  };

  // Override any parent styles
  useEffect(() => {
    // Force the body and html to not have any background
    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';
    
    // Find and override any parent elements
    const main = document.querySelector('main');
    if (main) {
      (main as HTMLElement).style.background = 'transparent';
    }
  }, []);

  return (
    <div 
      className="relative min-h-screen overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom right, #60a5fa, #a855f7, #ec4899) !important',
        backgroundColor: '#60a5fa !important',
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      
      {/* Video Background for all devices */}
      <video
        ref={(ref) => setVideoRef(ref)}
        key="background-video"
        autoPlay
        loop
        muted
        playsInline
        webkit-playsinline="true"
        preload="auto"
        className="absolute top-0 left-0 w-full h-full object-cover"
        style={{ 
          minWidth: '100%', 
          minHeight: '100%',
          zIndex: 1,
          WebkitTransform: 'translateZ(0)',
          transform: 'translateZ(0)'
        }}
        onLoadedMetadata={(e) => {
          const video = e.target as HTMLVideoElement;
          video.play().catch(err => {
            console.log('Autoplay failed, showing play button:', err);
            setShowPlayButton(true);
          });
        }}
        onLoadedData={() => {
          console.log('Video loaded successfully');
        }}
        onError={(e) => {
          console.error('Video failed to load:', e);
        }}
      >
        <source
          src="https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>
      
      {/* Play button for mobile if autoplay fails */}
      {showPlayButton && (
        <button
          onClick={() => {
            if (videoRef) {
              videoRef.play();
              setShowPlayButton(false);
            }
          }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-4 shadow-lg"
        >
          <svg className="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      {/* Main Content */}
      <AnimatePresence>
        {!isTransitioning && (
          <motion.div
            className="relative z-20 min-h-screen flex flex-col justify-end pb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center">
              <motion.h1
                className="text-3xl font-bold text-white drop-shadow-lg"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Welcome to AgriSkills
              </motion.h1>
              <motion.p
                className="text-l text-white mb-12 drop-shadow-lg"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Connecting farmers with technology
              </motion.p>

              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
              <div>
                <Button
                  onClick={() => handleNavigation('/login')}
                  className="w-64 h-14 text-lg font-semibold bg-green-600 hover:bg-green-700 transform transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  Sign In
                </Button>
              </div>
              <div>
                <Button
                  onClick={() => handleNavigation('/register')}
                  variant="outline"
                  className="w-64 h-14 text-lg font-semibold border-2 border-green-600 text-green-600 hover:bg-green-50 transform transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  Create Account
                </Button>
              </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Transition Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            className="fixed inset-0 z-50 bg-white"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <div className="min-h-screen flex items-center justify-center">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                }}
              >
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                  <circle cx="30" cy="30" r="25" stroke="#16a34a" strokeWidth="4" strokeDasharray="70 30" />
                </svg>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

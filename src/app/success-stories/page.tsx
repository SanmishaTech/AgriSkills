'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Search, Filter, Heart, Share, User, Calendar, TrendingUp, Award, X } from 'lucide-react';
import Image from 'next/image';
import HomeNavbar from '@/components/HomeNavbar';

interface SuccessStory {
  id: number;
  title: string;
  description: string;
  emoji: string;
  category: string;
  impact: string;
  image?: string;
  fullStory: string;
  author: string;
  location: string;
  date: string;
  readTime: string;
  likes: number;
  shares: number;
}

const successStoriesData: SuccessStory[] = [
  {
    id: 1,
    title: "Transforming Smallholder Farming with Sustainable Farming",
    description: "Narayan Bhau Bhoye implemented the No-Till/Regenerative Technique (SRT) to transform his farm.",
    image: "/images/successstories/successstories-1.jpg",
    fullStory: "Practices Farmer Mr. Narayan Bhau Bhoye, Gorthan Village, Palghar District\nA Real Life Case Study by Shop For Change Fair Trade NGO\n\n**Background:**\nShop for Change Fair Trade, with funding support from GeBBS Healthcare, launched a capacity-building project to promote sustainable agricultural practices among tribal farmers in Jawhar. A two-day focused training session was conducted for over 70 tribal farmers, ensuring equal participation from men and women. The training for male farmers was held in January 2025, following which one of the farmers immediately adopted the No-Till/Regenerative Technique (SRT) on his farm.\n\nNarayan Bhau Bhoye, a smallholder farmer from Gorthan village in Palghar district, is a notable example of success from this intervention. Known for his experimental nature, Narayan decided to initially apply SRT on a small portion of his land—2.5 gunthas—to assess the results before scaling up. Based on the outcomes from this trial, he plans to implement SRT across a larger area during the upcoming monsoon season.\n\n**SRT Application Details:**\n• Crop Selection: 1 Guntha Groundnut, 1 Guntha Wal (Indian Bean), 0.5 Guntha Chickpea\n• Date of Sowing: January 23, 2025\n• Expected Harvest Date: May 10, 2025\n\n**Benefits Experienced:**\n• Reduced Labor Requirement: Decreased from 10-15 workers (traditional farming) to 4-5 workers under SRT.\n• Cost Savings: Labor savings amounted to approximately ₹3,200.\n• Enhanced Crop Growth: Crop height increased from 2-3 feet (traditional) to over 3 feet with SRT.\n\n**Projected Economic Impact Summary:**\n• Income with Traditional Methods: ₹6,875\n• Projected Income with SRT: ₹11,525\n• Net Increase in Income: ₹4,650\n• Total Net Gain (Income Increase + Labor Savings): ₹7,850",
    emoji: "🌱",
    category: "Sustainable Farming",
    impact: "₹7,850 Net Gain",
    author: "Shop For Change NGO",
    location: "Palghar District",
    date: "2025-01-23",
    readTime: "3 min read",
    likes: 124,
    shares: 45
  },
  {
    id: 2,
    title: "Ecovibe Krushi Producer Company – A Women-Led Model of Rural Enterprise",
    description: "In the tribal belt of Palghar, Maharashtra, women farmers have long faced systemic barriers to income security.",
    image: "/images/successstories/successstories-2.jpg",
    fullStory: "**Background**\nIn the tribal belt of Palghar, Maharashtra, women farmers have long faced systemic barriers to income security, access to markets, and leadership opportunities. Recognizing the need for structural change, Shop for Change Fair Trade initiated the formation of a women-centric Farmer Producer Organization (FPO) to create long-term, market-driven empowerment.\n\n**The Intervention**\nIn February 2025, Ecovibe Krushi Producer Company Ltd. was officially registered. Designed to be a community-owned and women-led FPO, it focuses on building collective bargaining power, strengthening agricultural value chains, and enabling direct access to markets.\n\n**Projected Key Highlights**\n• 500+ tribal farmers to be mobilized, with majority women shareholders\n• Capacity-building workshops on FPO management, bookkeeping, agri-finance, and government schemes\n• Collective procurement of inputs (seeds, bio-fertilizers, equipment) to reduce costs by 15–20%\n• Development of value-added products such as turmeric powder, millet mixes, and forest produce\n\n**Expected Outcomes**\n• 30–50% increase in net incomes through improved input access and collective marketing\n• Enhanced women's leadership in agri-business and governance structures\n• Strengthened resilience against climate and market shocks through diversified income streams\n• A replicable model for scaling women-led FPOs in other tribal regions across India\n\n**Why This Matters**\nEcovibe Krushi Producer Company is envisioned as a blueprint for inclusive rural development, where tribal women shift from the margins to the mainstream of agricultural enterprise. Through market linkage, skill-building, and collective ownership, Ecovibe aims to redefine what rural self-reliance looks like.",
    emoji: "👩‍🌾",
    category: "Rural Enterprise",
    impact: "500+ Farmers Mobilized",
    author: "Shop For Change NGO",
    location: "Palghar District",
    date: "2025-02-10",
    readTime: "4 min read",
    likes: 215,
    shares: 62
  },
  {
    id: 3,
    title: "Babu Waghera – From Marginal Farmer to Export-Grade Chilli Producer",
    description: "Babu Waghera once relied on irregular daily wage work and low-yield farming for survival.",
    image: "/images/successstories/successstories-3.jpg",
    fullStory: "**Background**\nBabu Waghera, a tribal farmer from Jawhar Taluka in Maharashtra, once relied on irregular daily wage work and low-yield farming for survival. With minimal access to knowledge or infrastructure, his annual income was limited to around ₹20,000–₹25,000—barely enough to support his family.\n\n**The Turning Point**\nIn 2019, Babu joined a Shop for Change Fair Trade initiative aimed at linking tribal chilli farmers to premium global markets. With technical support, quality inputs, and training, he was selected as one of the farmers to cultivate export-grade green chillies.\n\n**Key Milestone**\nIn 2019–20, Babu's chillies were part of the first-ever tribal farmer export batch to London, supported by JSW Foundation and facilitated by Del Monte as the export partner. This marked a breakthrough in tribal farmer market access and profitability.\n\n**Impact and Achievements**\n• Cultivated high-grade green chillies that met export standards\n• Received post-harvest training in sorting, grading, and packaging\n• Earned over ₹1.5 lakh in a single season—a sixfold increase in his typical annual income\n• Emerged as a community role model, encouraging fellow farmers to shift from low-value crops to high-return, market-linked farming\n\n**Why It Matters**\nBabu Waghera's journey—from a struggling daily wage worker to an international exporter—is a powerful example of what is possible when grassroots talent meets global opportunity. His story reflects the core mission of Shop for Change: empowering farmers through dignified trade, not aid.",
    emoji: "🌶️",
    category: "Export Farming",
    impact: "₹1.5 lakh+ Earned",
    author: "Shop For Change NGO",
    location: "Jawhar Taluka",
    date: "2024-05-15",
    readTime: "5 min read",
    likes: 312,
    shares: 89
  }
];

export default function SuccessStoriesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStories, setFilteredStories] = useState(successStoriesData);
  const [likedStories, setLikedStories] = useState<Set<number>>(new Set());
  const [selectedStory, setSelectedStory] = useState<SuccessStory | null>(null);
  const [sharingStories, setSharingStories] = useState<Set<number>>(new Set());
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);

  useEffect(() => {
    let filtered = successStoriesData;

    if (searchQuery) {
      filtered = filtered.filter(story =>
        story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredStories(filtered);
  }, [searchQuery]);

  const handleLike = (storyId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedStories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(storyId)) {
        newSet.delete(storyId);
      } else {
        newSet.add(storyId);
      }
      return newSet;
    });
  };

  const handleShare = async (story: SuccessStory, e: React.MouseEvent) => {
    e.stopPropagation();

    // Prevent multiple concurrent shares for the same story
    if (sharingStories.has(story.id)) {
      return;
    }

    // Mark story as being shared
    setSharingStories(prev => new Set([...prev, story.id]));

    try {
      if (navigator.share) {
        await navigator.share({
          title: story.title,
          text: story.description,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(`${story.title} - ${window.location.href}`);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      // Handle share cancellation or errors silently
      console.log('Share cancelled or failed:', error);
    } finally {
      // Remove story from sharing state
      setSharingStories(prev => {
        const newSet = new Set(prev);
        newSet.delete(story.id);
        return newSet;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Shared Homepage Navbar */}
      <HomeNavbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isMobileSearchActive={isMobileSearchActive}
        setIsMobileSearchActive={setIsMobileSearchActive}
      />

      {/* Page Title */}
      <div className="bg-white border-b px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Success Stories</h1>
          <p className="text-gray-500 mt-1 text-sm">Inspiring journeys of transformation and growth</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <span className="text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredStories.length}</span> stories
              </span>
            </div>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                <span>Most Inspiring</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Stories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredStories.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No stories found</h3>
            <p className="text-gray-600">
              Try adjusting your search terms
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => setSelectedStory(story)}
              >
                {/* Story Header */}
                <div className="relative h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {/* @ts-ignore */}
                  {story.image ? (
                    /* @ts-ignore */
                    <Image src={story.image} alt={story.title} layout="fill" objectFit="cover" className="group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    /* @ts-ignore */
                    <span className="text-5xl relative z-10">{story.emoji}</span>
                  )}

                  {/* Gradient Overlay for better badge visibility */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent z-0 pointer-events-none" />

                  {/* Category Badge */}
                  <div className="absolute top-3 left-3 bg-white/95 text-gray-800 text-xs px-3 py-1 rounded-full font-semibold shadow-sm z-10">
                    {story.category}
                  </div>

                  {/* Impact Badge */}
                  <div className="absolute top-3 right-3 bg-green-600/95 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-sm z-10">
                    {story.impact}
                  </div>
                </div>

                {/* Story Content */}
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                    {story.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {story.description}
                  </p>

                  {/* Author Info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{story.author}</p>
                        <p className="text-xs text-gray-500">{story.location}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {story.readTime}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <button
                      onClick={(e) => handleLike(story.id, e)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${likedStories.has(story.id)
                        ? 'bg-red-50 text-red-600'
                        : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      <Heart className={`w-4 h-4 ${likedStories.has(story.id) ? 'fill-current' : ''}`} />
                      <span>{story.likes + (likedStories.has(story.id) ? 1 : 0)}</span>
                    </button>

                    <button
                      onClick={(e) => handleShare(story, e)}
                      className="flex items-center gap-1 px-3 py-1 rounded-full text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <Share className="w-4 h-4" />
                      <span>{story.shares}</span>
                    </button>

                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(story.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Full Story Modal */}
      {selectedStory && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedStory(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative h-48 sm:h-56 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-5xl overflow-hidden">
              {/* @ts-ignore */}
              {selectedStory.image ? (
                <>
                  {/* @ts-ignore */}
                  <Image src={selectedStory.image} alt={selectedStory.title} layout="fill" objectFit="cover" />
                  <div className="absolute inset-0 bg-black/20 z-0 pointer-events-none" />
                </>
              ) : (
                <span className="relative z-10">{selectedStory.emoji}</span>
              )}
              <button
                onClick={() => setSelectedStory(null)}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors z-20"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-128px)]">
              <div className="flex items-center gap-2 text-sm text-green-600 font-semibold mb-2">
                <span>{selectedStory.category}</span>
                <span>•</span>
                <span>{selectedStory.impact}</span>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {selectedStory.title}
              </h2>

              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedStory.author}</p>
                    <p className="text-sm text-gray-500">{selectedStory.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{selectedStory.readTime}</p>
                  <p className="text-xs text-gray-400">{new Date(selectedStory.date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {selectedStory.fullStory.split(/(\*\*.*?\*\*)/).map((part, i) =>
                    part.startsWith('**') && part.endsWith('**') ?
                      <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong> :
                      part
                  )}
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={(e) => handleLike(selectedStory.id, e)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${likedStories.has(selectedStory.id)
                    ? 'bg-red-50 text-red-600'
                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <Heart className={`w-4 h-4 ${likedStories.has(selectedStory.id) ? 'fill-current' : ''}`} />
                  <span>Like ({selectedStory.likes + (likedStories.has(selectedStory.id) ? 1 : 0)})</span>
                </button>

                <button
                  onClick={(e) => handleShare(selectedStory, e)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Share className="w-4 h-4" />
                  <span>Share ({selectedStory.shares})</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Search, Filter, Heart, Share, User, Calendar, TrendingUp, Award } from 'lucide-react';
import Image from 'next/image';

interface SuccessStory {
  id: number;
  title: string;
  description: string;
  emoji: string;
  category: string;
  impact: string;
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
    title: "Rekha trained 12 women in tailoring",
    description: "Rekha started a small training center in her village after completing our tailoring course.",
    fullStory: "Rekha Sharma, a 34-year-old mother of two from Rajasthan, transformed her life through our tailoring skills program. Starting with basic stitching knowledge, she mastered advanced tailoring techniques through our comprehensive course. Within six months, she established a small training center in her village, providing employment opportunities for local women. Today, she has trained over 12 women who are now earning independently, creating a ripple effect of empowerment in her community. Her center has become a hub for women's skill development, and she plans to expand to neighboring villages.",
    emoji: "✂️",
    category: "Tailoring",
    impact: "12 women trained",
    author: "Rekha Sharma",
    location: "Jaipur, Rajasthan",
    date: "2024-01-15",
    readTime: "3 min read",
    likes: 234,
    shares: 45
  },
  {
    id: 2,
    title: "Raju started organic farming in his village",
    description: "After learning organic farming techniques, Raju converted his 5-acre farm to profitable organic cultivation.",
    fullStory: "Raju Kumar's journey from conventional to organic farming began when he enrolled in our sustainable agriculture program. Initially skeptical about organic methods, he gradually learned about soil health, natural pest control, and sustainable water management. The transformation of his 5-acre farm took two years, but the results were remarkable. His organic vegetables and grains now fetch premium prices in local markets. He has reduced his input costs by 60% and increased his profit margins by 40%. Raju now mentors other farmers in his district, helping them transition to organic farming practices.",
    emoji: "🌱",
    category: "Organic Farming",
    impact: "5-acre farm converted",
    author: "Raju Kumar",
    location: "Meerut, Uttar Pradesh",
    date: "2024-02-10",
    readTime: "4 min read",
    likes: 189,
    shares: 62
  },
  {
    id: 3,
    title: "Meera's dairy business flourishes",
    description: "Meera expanded her dairy from 2 cows to 15 cows, increasing her monthly income by 400%.",
    fullStory: "Meera Patel started with just two local cows and a dream to become financially independent. Through our dairy management program, she learned about cattle nutrition, breeding techniques, and modern milking practices. She implemented scientific feeding schedules and proper healthcare for her cattle. Over 18 months, she gradually expanded her herd to 15 high-yielding crossbred cows. Her daily milk production increased from 20 liters to 180 liters. She now supplies milk to a local cooperative and has started producing paneer and ghee. Her monthly income has grown from ₹8,000 to ₹40,000, making her one of the most successful dairy entrepreneurs in her district.",
    emoji: "🥛",
    category: "Dairy Farming",
    impact: "400% income increase",
    author: "Meera Patel",
    location: "Anand, Gujarat",
    date: "2024-01-28",
    readTime: "5 min read",
    likes: 312,
    shares: 78
  },
  {
    id: 4,
    title: "Suresh's poultry farm success",
    description: "Starting with 50 chickens, Suresh now manages 1000+ birds and supplies to local markets.",
    fullStory: "Suresh Reddy's poultry venture began as a small backyard operation with 50 country chickens. After joining our poultry management course, he learned about modern housing systems, vaccination schedules, and feed management. He gradually upgraded his facilities and introduced improved breeds. His systematic approach to poultry farming, including proper biosecurity measures and record-keeping, helped him scale operations rapidly. Today, his farm houses over 1000 birds across different batches. He supplies eggs and meat to local markets, restaurants, and wholesalers. His monthly turnover has crossed ₹1.5 lakhs, and he employs three local youth in his operations.",
    emoji: "🐔",
    category: "Poultry Farming",
    impact: "1000+ birds managed",
    author: "Suresh Reddy",
    location: "Hyderabad, Telangana",
    date: "2024-02-20",
    readTime: "4 min read",
    likes: 267,
    shares: 54
  },
  {
    id: 5,
    title: "Priya's vegetable garden transformation",
    description: "Priya transformed her backyard into a profitable vegetable garden earning ₹8000 monthly.",
    fullStory: "Priya Singh utilized her small backyard space to create a thriving kitchen garden after completing our urban farming course. She learned about vertical gardening, container farming, and seasonal crop planning. Using innovative techniques like grow bags, trellises, and drip irrigation, she maximized her limited space. She grows a variety of vegetables including tomatoes, peppers, leafy greens, and herbs. Her produce is pesticide-free and freshly harvested, which attracts customers willing to pay premium prices. She sells directly to neighbors, local restaurants, and through online platforms. What started as a hobby has become a sustainable business earning her ₹8,000 monthly while providing fresh, healthy food for her family.",
    emoji: "🥬",
    category: "Kitchen Gardening",
    impact: "₹8000 monthly income",
    author: "Priya Singh",
    location: "Pune, Maharashtra",
    date: "2024-03-05",
    readTime: "3 min read",
    likes: 198,
    shares: 41
  },
  {
    id: 6,
    title: "Ramesh's bee-keeping venture",
    description: "Ramesh started with 5 hives and now harvests 200kg of honey annually.",
    fullStory: "Ramesh Kumar's apiary journey began with our beekeeping fundamentals course. Initially apprehensive about handling bees, he gained confidence through hands-on training and mentorship. He started with 5 traditional hives in his mango orchard. Learning about bee behavior, hive management, and honey extraction techniques, he gradually modernized his approach. He introduced improved hive designs and scientific management practices. His bee colonies thrived, and he expanded to 25 hives across different locations. He now harvests 200kg of pure honey annually, which he sells under his own brand. Additionally, he produces beeswax and offers pollination services to fruit growers. His success has inspired 10 other farmers in his area to start beekeeping.",
    emoji: "🐝",
    category: "Bee Keeping",
    impact: "200kg honey annually",
    author: "Ramesh Kumar",
    location: "Lucknow, Uttar Pradesh",
    date: "2024-02-14",
    readTime: "4 min read",
    likes: 156,
    shares: 33
  },
  {
    id: 7,
    title: "Sunita's mushroom cultivation",
    description: "Sunita's mushroom farm produces 50kg daily, supplying to restaurants and hotels.",
    fullStory: "Sunita Devi entered mushroom cultivation through our specialized training program on oyster mushroom production. She converted a small room in her house into a controlled environment for mushroom growing. Learning about substrate preparation, spawning, and environmental control, she achieved consistent production cycles. Her quality mushrooms gained recognition among local restaurants and hotels for their freshness and taste. She now operates multiple growing chambers and produces 50kg of mushrooms daily. Her product range includes oyster, shiitake, and button mushrooms. She has trained her two daughters in the business, making it a family enterprise. Her annual turnover exceeds ₹10 lakhs, and she has become a model entrepreneur in her district.",
    emoji: "🍄",
    category: "Mushroom Farming",
    impact: "50kg daily production",
    author: "Sunita Devi",
    location: "Shimla, Himachal Pradesh",
    date: "2024-01-22",
    readTime: "4 min read",
    likes: 223,
    shares: 47
  },
  {
    id: 8,
    title: "Vikram's fish farming success",
    description: "Vikram converted his 2-acre pond into a thriving fish farm with multiple species.",
    fullStory: "Vikram Yadav transformed his ancestral pond into a modern aquaculture facility through our fish farming program. He learned about pond preparation, water quality management, and integrated fish farming systems. Initially focusing on common carp and rohu, he gradually diversified to include catla, grass carp, and silver carp in a polyculture system. His scientific approach to feeding, aeration, and disease management resulted in excellent fish growth rates. He harvests 4 tonnes of fish every 8 months from his 2-acre pond. His fish are supplied to local markets, restaurants, and wholesalers across three districts. He has also started fish seed production, selling fingerlings to other fish farmers. His success has motivated many farmers to convert their unused ponds into productive aquaculture systems.",
    emoji: "🐟",
    category: "Fish Farming",
    impact: "2-acre fish farm",
    author: "Vikram Yadav",
    location: "Bhopal, Madhya Pradesh",
    date: "2024-03-12",
    readTime: "5 min read",
    likes: 189,
    shares: 39
  },
  {
    id: 9,
    title: "Kavita's spice processing unit",
    description: "Kavita processes and packages spices, supplying to 20+ retail stores in her district.",
    fullStory: "Kavita Sharma established her spice processing unit after completing our food processing and entrepreneurship program. She started by processing turmeric and chili powder using traditional methods, then gradually invested in modern grinding and packaging equipment. Her focus on quality control, hygienic processing, and attractive packaging helped her build a loyal customer base. She sources raw materials directly from farmers, ensuring quality and fair prices. Her product range now includes 15 different spices and spice blends. She supplies to over 20 retail stores across her district and has started online sales. Her branded spices have gained recognition for their purity and authentic taste. She employs 8 women from her village, providing them with steady income and skill development opportunities.",
    emoji: "🌶️",
    category: "Food Processing",
    impact: "20+ stores supplied",
    author: "Kavita Sharma",
    location: "Jodhpur, Rajasthan",
    date: "2024-02-28",
    readTime: "4 min read",
    likes: 145,
    shares: 29
  },
  {
    id: 10,
    title: "Ankit's hydroponic farming",
    description: "Ankit's soilless farming setup produces fresh vegetables year-round in controlled environment.",
    fullStory: "Ankit Verma pioneered hydroponic farming in his region after attending our advanced agricultural technology program. Initially investing in a small NFT (Nutrient Film Technique) system, he learned about nutrient solutions, pH management, and climate control. His soilless cultivation method allows year-round production of high-quality vegetables in controlled conditions. He specializes in growing lettuce, spinach, herbs, and cherry tomatoes. His produce is pesticide-free and has superior taste and nutritional value. He supplies to premium restaurants, health-conscious consumers, and organic stores in nearby cities. His 1000 sq ft hydroponic setup generates monthly revenue of ₹50,000. He has become a consultant for other farmers interested in adopting hydroponic technology and has trained over 50 farmers in the past year.",
    emoji: "💧",
    category: "Hydroponic Farming",
    impact: "Year-round production",
    author: "Ankit Verma",
    location: "Bangalore, Karnataka",
    date: "2024-03-18",
    readTime: "5 min read",
    likes: 278,
    shares: 68
  }
];

export default function SuccessStoriesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStories, setFilteredStories] = useState(successStoriesData);
  const [likedStories, setLikedStories] = useState<Set<number>>(new Set());
  const [selectedStory, setSelectedStory] = useState<SuccessStory | null>(null);
  const [sharingStories, setSharingStories] = useState<Set<number>>(new Set());

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
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Success Stories</h1>
                <p className="text-green-100 mt-1">Inspiring journeys of transformation and growth</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <Award className="w-8 h-8 text-yellow-300" />
              <div className="text-right">
                <p className="text-sm text-green-100">Featured Stories</p>
                <p className="text-lg font-semibold">{successStoriesData.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search stories, authors, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
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
                <div className="relative h-48 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-6xl">
                  <span>{story.emoji}</span>
                  
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-3 py-1 rounded-full font-semibold">
                    {story.category}
                  </div>
                  
                  {/* Impact Badge */}
                  <div className="absolute top-3 right-3 bg-green-500/90 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-semibold">
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
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                        likedStories.has(story.id)
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
            <div className="relative h-32 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-4xl">
              <span>{selectedStory.emoji}</span>
              <button
                onClick={() => setSelectedStory(null)}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white rotate-45" />
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
                  {selectedStory.fullStory}
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={(e) => handleLike(selectedStory.id, e)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    likedStories.has(selectedStory.id)
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

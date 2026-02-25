/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Search, 
  Moon, 
  Sun, 
  ExternalLink, 
  Filter, 
  MessageSquare, 
  Image as ImageIcon, 
  Video, 
  Code, 
  Mic2, 
  Zap,
  LayoutGrid,
  Star,
  Heart,
  Sparkles,
  Loader2,
  User as UserIcon,
  Megaphone,
  Palette,
  PenTool,
  Database,
  Music,
  GraduationCap,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Info,
  ThumbsUp,
  ThumbsDown,
  Share2,
  ChevronDown,
  ArrowLeftRight,
  Plus,
  Minus,
  Send,
  Mail,
  TrendingUp,
  Award,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAIRecommendations } from './services/geminiService';
import { TOOLS_DATA } from './toolsData';

// --- Types ---

export type Category = 'Chat AI' | 'Image Generation' | 'Video AI' | 'Coding AI' | 'Voice AI' | 'Productivity AI' | 'Marketing AI' | 'Design AI' | 'Writing AI' | 'Data AI' | 'Music AI' | 'Education AI';
export type Pricing = 'Free' | 'Freemium' | 'Paid';
export type SortOption = 'Most Popular' | 'Highest Rated' | 'Newest' | 'Free First';

export interface AITool {
  id: string;
  name: string;
  description: string;
  category: Category;
  pricing: Pricing;
  pricingDetails?: string;
  url: string;
  logo: string;
  features?: string[];
  pros?: string[];
  cons?: string[];
  useCases?: string[];
  rating: number;
  reviewCount: number;
  popularity: number;
  addedDate: string;
  videoUrl?: string;
  isVerified?: boolean;
  hasDeals?: boolean;
  tags?: string[];
}

interface Review {
  id: string;
  toolId: string;
  rating: number;
  comment: string;
  userName: string;
  date: string;
}

interface UserData {
  favorites: string[];
  ratings: Record<string, number>;
  reviews: Review[];
}

// --- Components ---

const ToolLogo = ({ src, name, className = "" }: { src: string, name: string, className?: string }) => {
  const [error, setError] = useState(false);
  
  return (
    <div className={`flex items-center justify-center overflow-hidden ${className} ${error ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
      {error ? (
        <div className="flex items-center justify-center w-full h-full text-white font-black text-2xl tracking-tighter">
          {name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
        </div>
      ) : (
        <img 
          src={src} 
          alt={name} 
          className="w-full h-full object-contain p-1"
          onError={() => setError(true)}
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
};

const CategoryIcon = ({ category }: { category: Category }) => {
  switch (category) {
    case 'Chat AI': return <MessageSquare size={16} />;
    case 'Image Generation': return <ImageIcon size={16} />;
    case 'Video AI': return <Video size={16} />;
    case 'Coding AI': return <Code size={16} />;
    case 'Voice AI': return <Mic2 size={16} />;
    case 'Productivity AI': return <Zap size={16} />;
    case 'Marketing AI': return <Megaphone size={16} />;
    case 'Design AI': return <Palette size={16} />;
    case 'Writing AI': return <PenTool size={16} />;
    case 'Data AI': return <Database size={16} />;
    case 'Music AI': return <Music size={16} />;
    case 'Education AI': return <GraduationCap size={16} />;
    default: return <LayoutGrid size={16} />;
  }
};

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [selectedPricing, setSelectedPricing] = useState<Pricing | 'All'>('All');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userData, setUserData] = useState<UserData>({ favorites: [], ratings: {}, reviews: [] });
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [aiNeed, setAiNeed] = useState('');
  const [aiRecommendations, setAiRecommendations] = useState<{ toolId: string; reason: string }[]>([]);
  const [isRecommending, setIsRecommending] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('Most Popular');
  const [compareList, setCompareList] = useState<string[]>([]);
  const [showCompareView, setShowCompareView] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [showDealsOnly, setShowDealsOnly] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' | 'error' }[]>([]);
  const [quickViewToolId, setQuickViewToolId] = useState<string | null>(null);
  const TOOLS_PER_PAGE = 24;

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  // Initialize theme and local data
  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
    
    const savedData = localStorage.getItem('ai_tools_user_data');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setUserData({
        favorites: parsed.favorites || [],
        ratings: parsed.ratings || {},
        reviews: parsed.reviews || []
      });
    }
  }, []);

  // Sync local data
  useEffect(() => {
    localStorage.setItem('ai_tools_user_data', JSON.stringify(userData));
  }, [userData]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedPricing]);

  // Reset tool view on search
  useEffect(() => {
    if (searchQuery) {
      setSelectedToolId(null);
    }
  }, [searchQuery]);

  const toggleFavorite = (toolId: string) => {
    const isFavorite = userData.favorites.includes(toolId);
    setUserData(prev => ({
      ...prev,
      favorites: isFavorite 
        ? prev.favorites.filter(id => id !== toolId) 
        : [...prev.favorites, toolId]
    }));
  };

  const toggleCompare = (toolId: string) => {
    setCompareList(prev => 
      prev.includes(toolId) 
        ? prev.filter(id => id !== toolId) 
        : prev.length < 3 ? [...prev, toolId] : prev
    );
  };

  const handleRate = (toolId: string, rating: number) => {
    setUserData(prev => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [toolId]: rating
      }
    }));
  };

  const handleSubmitReview = (toolId: string) => {
    if (!reviewComment.trim()) return;
    
    const newReview: Review = {
      id: Math.random().toString(36).substr(2, 9),
      toolId,
      rating: reviewRating,
      comment: reviewComment,
      userName: 'Anonymous User', // In a real app, this would be the logged-in user
      date: new Date().toISOString().split('T')[0]
    };

    setUserData(prev => ({
      ...prev,
      reviews: [newReview, ...prev.reviews]
    }));

    setReviewComment('');
    setReviewRating(5);
    showToast('Review submitted successfully!', 'success');
  };

  const handleGetRecommendations = async () => {
    if (!aiNeed.trim()) return;
    setIsRecommending(true);
    setRecommendationError(null);
    try {
      const recs = await getAIRecommendations(aiNeed, TOOLS_DATA);
      if (recs && recs.length > 0) {
        setAiRecommendations(recs);
      } else {
        setRecommendationError("I couldn't find any specific recommendations for that. Try rephrasing your need!");
      }
    } catch (err) {
      console.error(err);
      setRecommendationError("Something went wrong with the AI service. Please try again later.");
    } finally {
      setIsRecommending(false);
    }
  };

  const filteredTools = useMemo(() => {
    let result = TOOLS_DATA.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            tool.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;
      const matchesPricing = selectedPricing === 'All' || tool.pricing === selectedPricing;
      const matchesVerified = !showVerifiedOnly || tool.isVerified;
      const matchesDeals = !showDealsOnly || tool.hasDeals;
      return matchesSearch && matchesCategory && matchesPricing && matchesVerified && matchesDeals;
    });

    // Sorting logic
    result.sort((a, b) => {
      switch (sortBy) {
        case 'Most Popular':
          return b.popularity - a.popularity;
        case 'Highest Rated':
          return b.rating - a.rating;
        case 'Newest':
          return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
        case 'Free First': {
          const order = { 'Free': 0, 'Freemium': 1, 'Paid': 2 };
          return order[a.pricing] - order[b.pricing];
        }
        default:
          return 0;
      }
    });

    return result;
  }, [searchQuery, selectedCategory, selectedPricing, sortBy, showVerifiedOnly, showDealsOnly]);

  const categories: (Category | 'All')[] = [
    'All', 
    'Chat AI', 
    'Image Generation', 
    'Video AI', 
    'Coding AI', 
    'Voice AI', 
    'Productivity AI',
    'Marketing AI',
    'Design AI',
    'Writing AI',
    'Data AI',
    'Music AI',
    'Education AI'
  ];

  const pricingOptions: (Pricing | 'All')[] = ['All', 'Free', 'Freemium', 'Paid'];

  const selectedTool = useMemo(() => {
    return TOOLS_DATA.find(t => t.id === selectedToolId);
  }, [selectedToolId]);

  const similarTools = useMemo(() => {
    if (!selectedTool) return [];
    return TOOLS_DATA
      .filter(t => t.category === selectedTool.category && t.id !== selectedTool.id)
      .slice(0, 4);
  }, [selectedTool]);

  const totalPages = Math.ceil(filteredTools.length / TOOLS_PER_PAGE);
  const paginatedTools = useMemo(() => {
    const start = (currentPage - 1) * TOOLS_PER_PAGE;
    return filteredTools.slice(start, start + TOOLS_PER_PAGE);
  }, [filteredTools, currentPage]);

  const trendingTools = useMemo(() => {
    return [...TOOLS_DATA].sort((a, b) => b.popularity - a.popularity).slice(0, 5);
  }, []);

  const comparedTools = useMemo(() => {
    return TOOLS_DATA.filter(t => compareList.includes(t.id));
  }, [compareList]);

  const toolOfTheDay = useMemo(() => {
    // Deterministic selection based on date
    const today = new Date().toISOString().split('T')[0];
    const hash = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return TOOLS_DATA[hash % TOOLS_DATA.length];
  }, []);

  const getToolStats = useCallback((toolId: string) => {
    const tool = TOOLS_DATA.find(t => t.id === toolId);
    if (!tool) return { rating: 0, count: 0 };

    const userReviews = userData.reviews.filter(r => r.toolId === toolId);
    if (userReviews.length === 0) return { rating: tool.rating, count: tool.reviewCount };

    const totalRating = userReviews.reduce((acc, r) => acc + r.rating, 0) + (tool.rating * tool.reviewCount);
    const totalCount = userReviews.length + tool.reviewCount;
    
    return {
      rating: Number((totalRating / totalCount).toFixed(1)),
      count: totalCount
    };
  }, [userData.reviews]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="half-star" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950/80 border-zinc-800' : 'bg-white/80 border-zinc-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">AI</div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">Nexora AI</h1>
          </div>

          <div className="flex-1 max-w-md mx-4">
            <div className="relative group">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-zinc-500 group-focus-within:text-indigo-400' : 'text-zinc-400 group-focus-within:text-indigo-600'}`} size={18} />
              <input 
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-full border outline-none transition-all ${
                  isDarkMode 
                    ? 'bg-zinc-900 border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500' 
                    : 'bg-zinc-100 border-zinc-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
                }`}
              />
            </div>
          </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowSubmitModal(true)}
                className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  isDarkMode ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-100' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900'
                }`}
              >
                <Plus size={16} />
                Submit Tool
              </button>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-yellow-400' : 'hover:bg-zinc-100 text-zinc-600'}`}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {selectedToolId && selectedTool ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="py-4"
            >
              <button 
                onClick={() => setSelectedToolId(null)}
                className={`flex items-center gap-2 mb-8 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  isDarkMode ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-white border border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                <ArrowLeft size={16} />
                Back to Directory
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Main Content */}
                <div className="lg:col-span-2">
                  <div className="flex flex-col sm:flex-row items-start gap-8 mb-12">
                    <div className={`w-32 h-32 sm:w-48 sm:h-48 rounded-[2.5rem] overflow-hidden border-4 shadow-2xl ${isDarkMode ? 'border-zinc-800' : 'border-white'}`}>
                      <ToolLogo 
                        src={selectedTool.logo} 
                        name={selectedTool.name} 
                        className="w-full h-full"
                      />
                    </div>
                    <div className="flex-1 pt-4">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          selectedTool.pricing === 'Free' ? 'bg-emerald-500/10 text-emerald-500' :
                          selectedTool.pricing === 'Freemium' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-indigo-500/10 text-indigo-500'
                        }`}>
                          {selectedTool.pricing}
                        </span>
                        {selectedTool.isVerified && (
                          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                            <CheckCircle2 size={12} />
                            Verified
                          </span>
                        )}
                        {selectedTool.hasDeals && (
                          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                            <Zap size={12} />
                            Deal Active
                          </span>
                        )}
                        {selectedTool.pricingDetails && (
                          <span className={`text-xs font-bold opacity-60`}>
                            {selectedTool.pricingDetails}
                          </span>
                        )}
                        <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          <CategoryIcon category={selectedTool.category} />
                          {selectedTool.category}
                        </div>
                      </div>

                      {selectedTool.tags && (
                        <div className="flex flex-wrap gap-2 mb-6">
                          {selectedTool.tags.map(tag => (
                            <span key={tag} className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                              isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-zinc-50 border-zinc-100 text-zinc-400'
                            }`}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <h2 className="text-4xl sm:text-6xl font-black mb-4 tracking-tight">{selectedTool.name}</h2>
                      
                      <div className="flex items-center gap-4 mb-8">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star 
                              key={s} 
                              size={20} 
                              className={getToolStats(selectedTool.id).rating >= s ? 'text-yellow-400' : 'text-zinc-300'} 
                              fill={getToolStats(selectedTool.id).rating >= s ? "currentColor" : "none"} 
                            />
                          ))}
                        </div>
                        <span className="text-xl font-black">{getToolStats(selectedTool.id).rating}</span>
                        <span className="text-sm opacity-50 font-bold">({getToolStats(selectedTool.id).count} reviews)</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <a 
                          href={selectedTool.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center gap-2"
                        >
                          Visit Website
                          <ExternalLink size={18} />
                        </a>
                        <button 
                          onClick={() => toggleFavorite(selectedTool.id)}
                          className={`p-4 rounded-2xl transition-all ${
                            userData.favorites.includes(selectedTool.id) 
                              ? 'bg-pink-500/10 text-pink-500' 
                              : 'bg-zinc-500/10 text-zinc-500 hover:bg-pink-500/10 hover:text-pink-500'
                          }`}
                        >
                          <Heart size={24} fill={userData.favorites.includes(selectedTool.id) ? "currentColor" : "none"} />
                        </button>
                        <button 
                          onClick={() => toggleCompare(selectedTool.id)}
                          className={`p-4 rounded-2xl transition-all ${
                            compareList.includes(selectedTool.id) 
                              ? 'bg-indigo-500/10 text-indigo-500' 
                              : 'bg-zinc-500/10 text-zinc-500 hover:bg-indigo-500/10 hover:text-indigo-500'
                          }`}
                        >
                          <ArrowLeftRight size={24} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-12">
                    <section>
                      <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <Info className="text-indigo-600" size={24} />
                        About {selectedTool.name}
                      </h3>
                      <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        {selectedTool.description}
                      </p>
                    </section>

                    {selectedTool.useCases && (
                      <section>
                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                          <Award className="text-indigo-600" size={24} />
                          Top Use Cases
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {selectedTool.useCases.map((useCase, i) => (
                            <div key={i} className={`px-4 py-2 rounded-xl border text-sm font-bold ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-100 text-zinc-700'}`}>
                              {useCase}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {selectedTool.videoUrl && (
                      <section>
                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                          <Video className="text-indigo-600" size={24} />
                          Video Demo
                        </h3>
                        <div className="aspect-video rounded-[2.5rem] overflow-hidden border border-zinc-800 bg-black">
                          <iframe 
                            src={selectedTool.videoUrl.replace('watch?v=', 'embed/')} 
                            className="w-full h-full"
                            allowFullScreen
                          />
                        </div>
                      </section>
                    )}

                    {selectedTool.features && (
                      <section>
                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                          <Sparkles className="text-indigo-600" size={24} />
                          Key Features
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {selectedTool.features.map((feature, i) => (
                            <div key={i} className={`p-4 rounded-2xl border flex items-start gap-3 ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-100'}`}>
                              <div className="mt-1 w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 flex-shrink-0">
                                <Zap size={12} />
                              </div>
                              <span className="text-sm font-medium">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <section>
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                          <ThumbsUp className="text-emerald-500" size={20} />
                          Pros
                        </h3>
                        <ul className="space-y-3">
                          {(selectedTool.pros || ['Powerful AI capabilities', 'User-friendly interface', 'Regular updates']).map((pro, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm">
                              <CheckCircle2 className="text-emerald-500 mt-0.5 flex-shrink-0" size={16} />
                              <span className={isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                      <section>
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                          <ThumbsDown className="text-rose-500" size={20} />
                          Cons
                        </h3>
                        <ul className="space-y-3">
                          {(selectedTool.cons || ['Can be expensive', 'Learning curve for advanced features', 'Occasional latency']).map((con, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm">
                              <XCircle className="text-rose-500 mt-0.5 flex-shrink-0" size={16} />
                              <span className={isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}>{con}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    </div>

                    {/* Reviews Section */}
                    <section className="pt-12 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-bold flex items-center gap-2">
                          <MessageSquare className="text-indigo-600" size={24} />
                          User Reviews
                        </h3>
                        <div className="flex items-center gap-2">
                          <Star size={20} className="text-yellow-400" fill="currentColor" />
                          <span className="text-xl font-black">{getToolStats(selectedTool.id).rating}</span>
                          <span className="text-sm opacity-50 font-bold">({getToolStats(selectedTool.id).count} reviews)</span>
                        </div>
                      </div>

                      {/* Review Form */}
                      <div className={`p-8 rounded-[2rem] mb-12 border ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                        <h4 className="font-bold mb-6">Write a Review</h4>
                        <div className="flex items-center gap-2 mb-6">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setReviewRating(star)}
                              className={`transition-all hover:scale-110 ${
                                reviewRating >= star ? 'text-yellow-400' : 'text-zinc-300'
                              }`}
                            >
                              <Star size={24} fill={reviewRating >= star ? "currentColor" : "none"} />
                            </button>
                          ))}
                          <span className="ml-4 text-sm font-bold opacity-60">Your Rating</span>
                        </div>
                        <textarea 
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Share your experience with this tool..."
                          className={`w-full h-32 p-4 rounded-2xl border outline-none transition-all mb-4 resize-none ${
                            isDarkMode ? 'bg-zinc-950 border-zinc-800 focus:border-indigo-500' : 'bg-white border-zinc-200 focus:border-indigo-600'
                          }`}
                        />
                        <button 
                          onClick={() => handleSubmitReview(selectedTool.id)}
                          className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                        >
                          Submit Review
                        </button>
                      </div>

                      {/* Reviews List */}
                      <div className="space-y-6">
                        {userData.reviews.filter(r => r.toolId === selectedTool.id).length === 0 ? (
                          <div className="text-center py-12 opacity-40 italic">
                            No user reviews yet. Be the first to review!
                          </div>
                        ) : (
                          userData.reviews.filter(r => r.toolId === selectedTool.id).map(review => (
                            <div key={review.id} className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/30 border-zinc-800' : 'bg-white border-zinc-100'}`}>
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                                    {review.userName.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-sm">{review.userName}</div>
                                    <div className="text-[10px] opacity-40 uppercase font-black tracking-widest">{review.date}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map(s => (
                                    <Star key={s} size={12} className={review.rating >= s ? 'text-yellow-400' : 'text-zinc-300'} fill={review.rating >= s ? "currentColor" : "none"} />
                                  ))}
                                </div>
                              </div>
                              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                {review.comment}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </section>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-12">
                  <section className={`p-8 rounded-[2.5rem] border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-xl shadow-zinc-200/50'}`}>
                    <h3 className="text-xl font-bold mb-6">Community Rating</h3>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="text-5xl font-black text-indigo-600">{getToolStats(selectedTool.id).rating}</div>
                      <div>
                        <div className="flex text-yellow-400 mb-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              size={16} 
                              fill={getToolStats(selectedTool.id).rating >= star ? "currentColor" : getToolStats(selectedTool.id).rating >= star - 0.5 ? "url(#half-star)" : "none"} 
                              className={getToolStats(selectedTool.id).rating >= star ? "" : "text-zinc-300"}
                            />
                          ))}
                        </div>
                        <div className="text-xs font-bold opacity-40 uppercase tracking-widest">
                          Based on {getToolStats(selectedTool.id).count >= 1000 ? `${(getToolStats(selectedTool.id).count / 1000).toFixed(1)}k` : getToolStats(selectedTool.id).count} reviews
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="text-sm font-bold mb-2">Rate this tool</div>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRate(selectedTool.id, star)}
                            className={`transition-all hover:scale-125 ${
                              (userData.ratings[selectedTool.id] || 0) >= star 
                                ? 'text-yellow-400' 
                                : 'text-zinc-300 hover:text-yellow-200'
                            }`}
                          >
                            <Star size={24} fill={(userData.ratings[selectedTool.id] || 0) >= star ? "currentColor" : "none"} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>

                  {similarTools.length > 0 && (
                    <section>
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <LayoutGrid className="text-indigo-600" size={20} />
                        Similar Tools
                      </h3>
                      <div className="space-y-4">
                        {similarTools.map(tool => (
                          <button 
                            key={tool.id}
                            onClick={() => {
                              setSelectedToolId(tool.id);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all text-left ${
                              isDarkMode ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-100 hover:border-indigo-200 hover:shadow-lg'
                            }`}
                          >
                            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                              <ToolLogo src={tool.logo} name={tool.name} className="w-full h-full" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold truncate">{tool.name}</div>
                              <div className="text-xs opacity-50 truncate">{tool.category}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  <button 
                    onClick={() => {
                      const shareData = {
                        title: `${selectedTool.name} - Nexora AI`,
                        text: `Check out ${selectedTool.name} on Nexora AI: ${selectedTool.description}`,
                        url: window.location.href,
                      };
                      if (navigator.share) {
                        navigator.share(shareData).catch(console.error);
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        showToast('Link copied to clipboard!', 'info');
                      }
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold border transition-all ${
                      isDarkMode ? 'border-zinc-800 hover:bg-zinc-900' : 'border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    <Share2 size={16} />
                    Share Tool
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="directory"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Hero Section */}
              <section className="mb-12 text-center relative">
          <div className="absolute inset-0 -z-10 bg-indigo-500/5 blur-[100px] rounded-full" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-bold mb-6"
          >
            <Sparkles size={14} />
            AI-POWERED DIRECTORY
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-4 leading-tight"
          >
            The Future of <span className="text-indigo-600">Intelligence</span> <br className="hidden sm:block" /> at Your Fingertips
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`text-lg max-w-2xl mx-auto mb-10 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
          >
            Curated, rated, and recommended. Find the perfect AI tool for any task in seconds.
          </motion.p>

          {/* Tool of the Day */}
          <section className="mb-16">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`relative p-8 rounded-[3rem] border-2 border-indigo-500/20 overflow-hidden group ${
                isDarkMode ? 'bg-zinc-900/40' : 'bg-white shadow-2xl shadow-indigo-500/5'
              }`}
            >
              <div className="absolute top-0 right-0 p-6">
                <div className="bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-600/20">Tool of the Day</div>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="w-32 h-32 md:w-48 md:h-48 rounded-[2.5rem] overflow-hidden border-4 border-white dark:border-zinc-800 shadow-2xl flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                  <ToolLogo src={toolOfTheDay.logo} name={toolOfTheDay.name} className="w-full h-full" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                    <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest">{toolOfTheDay.category}</span>
                    {toolOfTheDay.isVerified && (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                        <CheckCircle2 size={12} />
                        Verified
                      </span>
                    )}
                  </div>
                  <h3 className="text-3xl md:text-5xl font-black mb-2 tracking-tight">{toolOfTheDay.name}</h3>
                  
                  <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star 
                          key={s} 
                          size={16} 
                          className={getToolStats(toolOfTheDay.id).rating >= s ? 'text-yellow-400' : 'text-zinc-300'} 
                          fill={getToolStats(toolOfTheDay.id).rating >= s ? "currentColor" : "none"} 
                        />
                      ))}
                    </div>
                    <span className="text-lg font-black">{getToolStats(toolOfTheDay.id).rating}</span>
                    <span className="text-xs opacity-50 font-bold">({getToolStats(toolOfTheDay.id).count} reviews)</span>
                  </div>

                  <p className={`text-lg mb-8 line-clamp-2 max-w-2xl ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {toolOfTheDay.description}
                  </p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                    <button 
                      onClick={() => setSelectedToolId(toolOfTheDay.id)}
                      className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20"
                    >
                      View Details
                    </button>
                    <a 
                      href={toolOfTheDay.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-8 py-4 rounded-2xl font-bold border transition-all flex items-center gap-2 ${
                        isDarkMode ? 'border-zinc-800 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-50'
                      }`}
                    >
                      Visit Website
                      <ExternalLink size={18} />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Collections Section */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black flex items-center gap-2">
                <LayoutGrid className="text-indigo-600" size={24} />
                Curated Collections
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'AI for Marketing', category: 'Marketing AI', count: 124, icon: <Zap size={20} />, color: 'bg-amber-500' },
                { name: 'Coding Assistants', category: 'Coding AI', count: 85, icon: <Code size={20} />, color: 'bg-indigo-500' },
                { name: 'Content Creation', category: 'Writing AI', count: 210, icon: <PenTool size={20} />, color: 'bg-emerald-500' },
                { name: 'Data Analysis', category: 'Data AI', count: 42, icon: <Database size={20} />, color: 'bg-rose-500' },
              ].map((collection, i) => (
                <motion.button
                  key={i}
                  whileHover={{ y: -5 }}
                  className={`p-6 rounded-[2rem] text-left group transition-all border ${
                    isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-indigo-500/50' : 'bg-white border-zinc-100 hover:border-indigo-500/50 shadow-lg shadow-zinc-200/50'
                  }`}
                  onClick={() => {
                    setSelectedCategory(collection.category as Category);
                    setSearchQuery('');
                    document.getElementById('main-directory')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <div className={`w-12 h-12 rounded-2xl ${collection.color} text-white flex items-center justify-center mb-4 shadow-lg shadow-${collection.color.split('-')[1]}-500/20`}>
                    {collection.icon}
                  </div>
                  <h3 className="font-bold text-lg mb-1">{collection.name}</h3>
                  <p className="text-xs opacity-50 font-bold uppercase tracking-wider">{collection.count} Tools</p>
                </motion.button>
              ))}
            </div>
          </section>

          {/* Trending Section */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <TrendingUp className="text-indigo-600" size={24} />
                Trending Now
              </h3>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse delay-75" />
                <div className="w-2 h-2 rounded-full bg-indigo-200 animate-pulse delay-150" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {trendingTools.map((tool, i) => (
                <motion.button
                  key={tool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setSelectedToolId(tool.id)}
                  className={`p-4 rounded-3xl border flex flex-col items-center text-center transition-all group ${
                    isDarkMode 
                      ? 'bg-zinc-900/50 border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-900' 
                      : 'bg-white border-zinc-100 hover:border-indigo-600/50 hover:shadow-xl'
                  }`}
                >
                  <div className="w-16 h-16 rounded-2xl overflow-hidden mb-4 border border-zinc-100 dark:border-zinc-800 group-hover:scale-110 transition-transform">
                    <ToolLogo src={tool.logo} name={tool.name} className="w-full h-full" />
                  </div>
                  <div className="font-bold text-sm mb-1 truncate w-full">{tool.name}</div>
                  <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-3">{tool.category}</div>
                  <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
                    <Star size={12} fill="currentColor" />
                    {tool.rating}
                  </div>
                </motion.button>
              ))}
            </div>
          </section>

          {/* AI Recommendation Box */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`max-w-3xl mx-auto p-1 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-2xl shadow-indigo-500/20`}
          >
            <div className={`p-6 rounded-[22px] ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    placeholder="Describe what you need to do... (e.g. 'I need to edit a podcast')"
                    value={aiNeed}
                    onChange={(e) => setAiNeed(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGetRecommendations()}
                    className={`w-full px-4 py-3 rounded-2xl border outline-none transition-all ${
                      isDarkMode ? 'bg-zinc-950 border-zinc-800 focus:border-indigo-500' : 'bg-zinc-50 border-zinc-100 focus:border-indigo-600'
                    }`}
                  />
                </div>
                <button 
                  onClick={handleGetRecommendations}
                  disabled={isRecommending || !aiNeed.trim()}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRecommending ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                  Ask AI
                </button>
              </div>

              {recommendationError && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-sm text-pink-500 font-medium"
                >
                  {recommendationError}
                </motion.p>
              )}

              <AnimatePresence>
                {aiRecommendations.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-8 pt-8 border-t border-zinc-800/10"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-lg font-bold flex items-center gap-2 text-indigo-600">
                        <Sparkles size={20} />
                        Personalized Recommendations
                      </h4>
                      <button 
                        onClick={() => setAiRecommendations([])}
                        className="text-xs font-bold opacity-40 hover:opacity-100 transition-opacity uppercase tracking-widest"
                      >
                        Clear Results
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {aiRecommendations.map((rec) => {
                        const tool = TOOLS_DATA.find(t => t.id === rec.toolId);
                        if (!tool) return null;
                        return (
                          <motion.button
                            key={rec.toolId}
                            whileHover={{ y: -5 }}
                            onClick={() => {
                              setSelectedToolId(tool.id);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`group p-5 rounded-3xl border text-left transition-all relative overflow-hidden ${
                              isDarkMode 
                                ? 'bg-zinc-950 border-zinc-800 hover:border-indigo-500/50' 
                                : 'bg-white border-zinc-100 hover:border-indigo-600/50 shadow-xl shadow-zinc-200/50'
                            }`}
                          >
                            <div className="absolute top-0 right-0 p-3">
                              <div className="bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">AI Pick</div>
                            </div>
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-12 h-12 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
                                <ToolLogo src={tool.logo} name={tool.name} className="w-full h-full" />
                              </div>
                              <div>
                                <div className="font-bold text-base group-hover:text-indigo-600 transition-colors">{tool.name}</div>
                                <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{tool.category}</div>
                              </div>
                            </div>
                            <p className={`text-xs leading-relaxed italic ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                              "{rec.reason}"
                            </p>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </section>

        {/* Filters */}
        <div id="main-directory" className="flex flex-col md:flex-row gap-6 mb-8 items-end scroll-mt-20">
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-60">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : isDarkMode 
                        ? 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800' 
                        : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="md:w-64">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-60">Pricing</label>
            <div className="flex gap-2">
              {pricingOptions.map((price) => (
                <button
                  key={price}
                  onClick={() => setSelectedPricing(price)}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedPricing === price
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : isDarkMode 
                        ? 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800' 
                        : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  {price}
                </button>
              ))}
            </div>
          </div>

          <div className="md:w-48">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-60">Sort By</label>
            <div className="relative group">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className={`w-full appearance-none px-4 py-1.5 rounded-lg text-sm font-medium outline-none transition-all cursor-pointer border ${
                  isDarkMode 
                    ? 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800' 
                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                }`}
              >
                {['Most Popular', 'Highest Rated', 'Newest', 'Free First'].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold border transition-all flex items-center gap-2 ${
                showVerifiedOnly 
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' 
                  : isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-white border-zinc-200 text-zinc-600'
              }`}
            >
              <CheckCircle2 size={16} />
              Verified
            </button>
            <button 
              onClick={() => setShowDealsOnly(!showDealsOnly)}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold border transition-all flex items-center gap-2 ${
                showDealsOnly 
                  ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' 
                  : isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-white border-zinc-200 text-zinc-600'
              }`}
            >
              <Zap size={16} />
              Deals
            </button>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm opacity-60">
            Showing <span className="font-bold">{filteredTools.length}</span> tools
          </p>
          {(selectedCategory !== 'All' || selectedPricing !== 'All' || searchQuery || showVerifiedOnly || showDealsOnly) && (
            <button 
              onClick={() => {
                setSelectedCategory('All');
                setSelectedPricing('All');
                setSearchQuery('');
                setShowVerifiedOnly(false);
                setShowDealsOnly(false);
              }}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>

              {/* Tools Grid */}
              <motion.div 
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {paginatedTools.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="col-span-full py-20 text-center"
                    >
                      <div className="w-20 h-20 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search size={32} />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">No tools found</h3>
                      <p className="opacity-50 max-w-xs mx-auto">
                        We couldn't find any tools matching your current filters. Try adjusting your search or categories.
                      </p>
                      <button 
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('All');
                          setSelectedPricing('All');
                          setShowVerifiedOnly(false);
                          setShowDealsOnly(false);
                        }}
                        className="mt-8 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                      >
                        Reset All Filters
                      </button>
                    </motion.div>
                  ) : (
                    paginatedTools.map((tool) => (
                    <motion.div
                      key={tool.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => setSelectedToolId(tool.id)}
                      className={`group relative flex flex-col rounded-3xl border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer ${
                        isDarkMode 
                          ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:shadow-indigo-500/10' 
                          : 'bg-white border-zinc-200 hover:border-indigo-200 hover:shadow-indigo-500/10'
                      }`}
                    >
                      <div className="p-6 flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-14 h-14 rounded-2xl overflow-hidden border ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                            <ToolLogo 
                              src={tool.logo} 
                              name={tool.name} 
                              className="w-full h-full"
                            />
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex gap-1">
                              {tool.isVerified && (
                                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500" title="Verified Tool">
                                  <CheckCircle2 size={14} />
                                </div>
                              )}
                              {tool.hasDeals && (
                                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500" title="Has Deals">
                                  <Zap size={14} />
                                </div>
                              )}
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(tool.id);
                              }}
                              className={`p-2 rounded-full transition-all ${
                                userData.favorites.includes(tool.id) 
                                  ? 'bg-pink-500/10 text-pink-500' 
                                  : 'bg-zinc-500/10 text-zinc-500 hover:bg-pink-500/10 hover:text-pink-500'
                              }`}
                            >
                              <Heart size={18} fill={userData.favorites.includes(tool.id) ? "currentColor" : "none"} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCompare(tool.id);
                              }}
                              className={`p-2 rounded-full transition-all ${
                                compareList.includes(tool.id) 
                                  ? 'bg-indigo-500/10 text-indigo-500' 
                                  : 'bg-zinc-500/10 text-zinc-500 hover:bg-indigo-500/10 hover:text-indigo-500'
                              }`}
                            >
                              <ArrowLeftRight size={18} />
                            </button>
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                              tool.pricing === 'Free' ? 'bg-emerald-500/10 text-emerald-500' :
                              tool.pricing === 'Freemium' ? 'bg-amber-500/10 text-amber-500' :
                              'bg-indigo-500/10 text-indigo-500'
                            }`}>
                              {tool.pricing}
                            </span>
                          </div>
                        </div>

                        <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                          {tool.name}
                        </h3>
                        
                        <div className={`flex items-center gap-1.5 text-xs mb-3 font-medium ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          <CategoryIcon category={tool.category} />
                          {tool.category}
                        </div>

                        {tool.tags && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {tool.tags.slice(0, 3).map(tag => (
                              <span key={tag} className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-100 text-zinc-400'}`}>
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className={`text-sm line-clamp-3 mb-6 leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                          {tool.description}
                        </p>

                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex items-center gap-1">
                            <Star size={14} className="text-yellow-400" fill="currentColor" />
                            <span className="text-sm font-black">{getToolStats(tool.id).rating}</span>
                          </div>
                          <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">({getToolStats(tool.id).count} reviews)</span>
                        </div>

                        {/* Rating System */}
                        <div className="flex items-center gap-1 mb-4">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRate(tool.id, star);
                              }}
                              className={`transition-all hover:scale-125 ${
                                (userData.ratings[tool.id] || 0) >= star 
                                  ? 'text-yellow-400' 
                                  : 'text-zinc-300 hover:text-yellow-200'
                              }`}
                            >
                              <Star size={16} fill={(userData.ratings[tool.id] || 0) >= star ? "currentColor" : "none"} />
                            </button>
                          ))}
                          <span className="text-[10px] font-bold ml-2 opacity-40">YOUR RATING</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(tool.url);
                              showToast('Link copied!', 'info');
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                              isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500'
                            }`}
                          >
                            <Share2 size={12} />
                            Copy Link
                          </button>
                        </div>
                      </div>

                      <div className={`p-4 border-t transition-colors ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                        <div className="flex gap-2">
                          <a 
                            href={tool.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all ${
                              isDarkMode 
                                ? 'bg-zinc-800 hover:bg-indigo-600 text-zinc-100' 
                                : 'bg-zinc-100 hover:bg-indigo-600 hover:text-white text-zinc-900'
                            }`}
                          >
                            Visit
                            <ExternalLink size={14} />
                          </a>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickViewToolId(tool.id);
                            }}
                            className={`flex-1 py-3 rounded-2xl text-sm font-bold border transition-all ${
                              isDarkMode ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-400' : 'border-zinc-200 hover:bg-zinc-50 text-zinc-600'
                            }`}
                          >
                            Quick View
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )))}
                </AnimatePresence>
              </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                isDarkMode ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-white border border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show limited page numbers if there are too many
                if (totalPages > 7) {
                  if (page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 1) {
                    if (page === 2 || page === totalPages - 1) return <span key={page} className="px-2 opacity-30">...</span>;
                    return null;
                  }
                }
                
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                        : isDarkMode ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-white border border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                isDarkMode ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-white border border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              Next
            </button>
          </div>
        )}

        {/* Newsletter Section */}
        <section className={`mt-24 p-12 rounded-[3rem] text-center relative overflow-hidden ${
          isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-indigo-600 text-white'
        }`}>
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          </div>
          <Mail className="mx-auto mb-6 opacity-50" size={48} />
          <h3 className="text-3xl font-black mb-4">Stay Ahead of the AI Curve</h3>
          <p className={`max-w-xl mx-auto mb-8 text-lg ${isDarkMode ? 'text-zinc-400' : 'text-indigo-100'}`}>
            Join 50,000+ professionals getting weekly updates on the latest AI tools and trends.
          </p>
          <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
            <input 
              type="email" 
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`flex-1 px-6 py-4 rounded-2xl outline-none text-zinc-900 ${
                isDarkMode ? 'bg-zinc-950 border border-zinc-800 text-white' : 'bg-white'
              }`}
            />
            <button 
              onClick={() => {
                if (email) {
                  setIsSubscribed(true);
                  setEmail('');
                }
              }}
              className={`px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                isDarkMode ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-zinc-900 text-white hover:bg-black'
              }`}
            >
              {isSubscribed ? <CheckCircle2 size={20} /> : <Send size={20} />}
              {isSubscribed ? 'Subscribed!' : 'Subscribe'}
            </button>
          </div>
          {isSubscribed && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm font-bold opacity-80"
            >
              Welcome to the future! Check your inbox soon.
            </motion.p>
          )}
        </section>

        {/* Empty State */}
        {filteredTools.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'}`}>
              <Filter className="opacity-20" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">No tools found</h3>
            <p className="opacity-60">Try adjusting your search or filters to find what you're looking for.</p>
          </motion.div>
        )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className={`mt-24 border-t py-12 transition-colors ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-400'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-xs">AI</div>
            <span className="font-bold text-zinc-900 dark:text-white">Nexora AI</span>
          </div>
          <div className="flex gap-8 text-sm font-medium">
            <a href="#" className="hover:text-indigo-600 transition-colors">Directory</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Categories</a>
            <button onClick={() => setShowSubmitModal(true)} className="hover:text-indigo-600 transition-colors">Submit Tool</button>
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
          </div>
          <div className="text-sm">
            © {new Date().getFullYear()} Nexora AI. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Comparison Bar */}
      <AnimatePresence>
        {compareList.length > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className={`fixed bottom-0 left-0 right-0 z-[60] p-4 border-t shadow-2xl ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
            }`}
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 overflow-x-auto pb-2 sm:pb-0">
                <div className="hidden sm:block text-sm font-bold opacity-50 uppercase tracking-widest whitespace-nowrap">Compare ({compareList.length}/3)</div>
                {comparedTools.map(tool => (
                  <div key={tool.id} className={`flex items-center gap-2 p-2 rounded-xl border ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                      <ToolLogo src={tool.logo} name={tool.name} className="w-full h-full" />
                    </div>
                    <span className="text-xs font-bold truncate max-w-[100px]">{tool.name}</span>
                    <button onClick={() => toggleCompare(tool.id)} className="p-1 hover:text-rose-500 transition-colors">
                      <Minus size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setCompareList([])}
                  className="text-xs font-bold opacity-50 hover:opacity-100 transition-opacity uppercase tracking-widest"
                >
                  Clear
                </button>
                <button 
                  disabled={compareList.length < 2}
                  onClick={() => setShowCompareView(true)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
                >
                  <ArrowLeftRight size={18} />
                  Compare Now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison View Modal */}
      <AnimatePresence>
        {showCompareView && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={`w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-[3rem] shadow-2xl flex flex-col ${
                isDarkMode ? 'bg-zinc-950 border border-zinc-800' : 'bg-white'
              }`}
            >
              <div className="p-8 border-b flex items-center justify-between">
                <h3 className="text-2xl font-black flex items-center gap-3">
                  <ArrowLeftRight className="text-indigo-600" size={28} />
                  Tool Comparison
                </h3>
                <button 
                  onClick={() => setShowCompareView(false)}
                  className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
                >
                  <XCircle size={28} />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-8">
                <div className="grid grid-cols-4 gap-8 min-w-[800px]">
                  <div className="space-y-12 pt-24">
                    <div className="h-20 flex items-center font-bold opacity-40 uppercase tracking-widest text-xs">Overview</div>
                    <div className="h-12 flex items-center font-bold opacity-40 uppercase tracking-widest text-xs">Pricing</div>
                    <div className="h-12 flex items-center font-bold opacity-40 uppercase tracking-widest text-xs">Rating</div>
                    <div className="h-40 flex items-center font-bold opacity-40 uppercase tracking-widest text-xs">Features</div>
                    <div className="h-40 flex items-center font-bold opacity-40 uppercase tracking-widest text-xs">Pros</div>
                  </div>
                  {comparedTools.map(tool => (
                    <div key={tool.id} className="space-y-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-3xl overflow-hidden mb-4 border border-zinc-100 dark:border-zinc-800 shadow-xl">
                          <ToolLogo src={tool.logo} name={tool.name} className="w-full h-full" />
                        </div>
                        <div className="font-black text-xl">{tool.name}</div>
                        <div className="text-xs font-bold opacity-40 uppercase tracking-widest">{tool.category}</div>
                      </div>
                      <div className="h-12 flex items-center justify-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          tool.pricing === 'Free' ? 'bg-emerald-500/10 text-emerald-500' :
                          tool.pricing === 'Freemium' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-indigo-500/10 text-indigo-500'
                        }`}>
                          {tool.pricing}
                        </span>
                      </div>
                      <div className="h-12 flex items-center justify-center gap-2">
                        <Star size={16} className="text-yellow-400" fill="currentColor" />
                        <span className="font-black text-lg">{tool.rating}</span>
                      </div>
                      <div className="h-40 overflow-auto text-left space-y-2">
                        {tool.features?.slice(0, 5).map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <CheckCircle2 size={12} className="text-indigo-500" />
                            {f}
                          </div>
                        ))}
                      </div>
                      <div className="h-40 overflow-auto text-left space-y-2">
                        {tool.pros?.slice(0, 5).map((p, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <ThumbsUp size={12} className="text-emerald-500" />
                            {p}
                          </div>
                        ))}
                      </div>
                      <a 
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm block hover:bg-indigo-700 transition-all"
                      >
                        Visit Website
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Tool Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={`w-full max-w-lg overflow-hidden rounded-[3rem] shadow-2xl ${
                isDarkMode ? 'bg-zinc-950 border border-zinc-800' : 'bg-white'
              }`}
            >
              <div className="p-8 border-b flex items-center justify-between">
                <h3 className="text-2xl font-black flex items-center gap-3">
                  <Plus className="text-indigo-600" size={28} />
                  Submit a Tool
                </h3>
                <button 
                  onClick={() => setShowSubmitModal(false)}
                  className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
                >
                  <XCircle size={28} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Found a great AI tool that's missing from our directory? Let us know!
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2 opacity-50">Tool Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. ChatGPT"
                      className={`w-full px-4 py-3 rounded-2xl border outline-none transition-all ${
                        isDarkMode ? 'bg-zinc-900 border-zinc-800 focus:border-indigo-500' : 'bg-zinc-50 border-zinc-100 focus:border-indigo-600'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2 opacity-50">Website URL</label>
                    <input 
                      type="url" 
                      placeholder="https://..."
                      className={`w-full px-4 py-3 rounded-2xl border outline-none transition-all ${
                        isDarkMode ? 'bg-zinc-900 border-zinc-800 focus:border-indigo-500' : 'bg-zinc-50 border-zinc-100 focus:border-indigo-600'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2 opacity-50">Category</label>
                    <select className={`w-full px-4 py-3 rounded-2xl border outline-none transition-all appearance-none ${
                        isDarkMode ? 'bg-zinc-900 border-zinc-800 focus:border-indigo-500' : 'bg-zinc-50 border-zinc-100 focus:border-indigo-600'
                      }`}>
                      {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    showToast('Thanks for the submission! Our team will review it soon.', 'success');
                    setShowSubmitModal(false);
                  }}
                  className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                >
                  Submit for Review
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-auto border ${
                toast.type === 'success' ? 'bg-emerald-500 text-white border-emerald-400' :
                toast.type === 'error' ? 'bg-rose-500 text-white border-rose-400' :
                isDarkMode ? 'bg-zinc-900 text-zinc-100 border-zinc-800' : 'bg-white text-zinc-900 border-zinc-200'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 size={18} />}
              {toast.type === 'error' && <XCircle size={18} />}
              {toast.type === 'info' && <Info size={18} className="text-indigo-500" />}
              <span className="text-sm font-bold">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Quick View Modal */}
      <AnimatePresence>
        {quickViewToolId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          >
            <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" onClick={() => setQuickViewToolId(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[3rem] border shadow-2xl ${
                isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'
              }`}
            >
              <button 
                onClick={() => setQuickViewToolId(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-500/10 transition-colors z-10"
              >
                <X size={24} />
              </button>

              {(() => {
                const tool = TOOLS_DATA.find(t => t.id === quickViewToolId);
                if (!tool) return null;
                return (
                  <div className="p-8 sm:p-12">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-8">
                      <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-white dark:border-zinc-800 shadow-2xl flex-shrink-0">
                        <ToolLogo src={tool.logo} name={tool.name} className="w-full h-full" />
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-4">
                          <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest">{tool.category}</span>
                          {tool.isVerified && (
                            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                              <CheckCircle2 size={12} />
                              Verified
                            </span>
                          )}
                        </div>
                        <h3 className="text-3xl font-black mb-2 tracking-tight">{tool.name}</h3>
                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-6">
                          <Star size={16} className="text-yellow-400" fill="currentColor" />
                          <span className="font-black">{getToolStats(tool.id).rating}</span>
                          <span className="text-xs opacity-40 font-bold uppercase tracking-widest">({getToolStats(tool.id).count} reviews)</span>
                        </div>
                      </div>
                    </div>

                    <p className={`text-lg mb-8 leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {tool.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-10">
                      <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                        <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Pricing</div>
                        <div className="font-bold text-lg">{tool.pricing}</div>
                      </div>
                      <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                        <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Popularity</div>
                        <div className="font-bold text-lg">{tool.popularity}%</div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <button 
                        onClick={() => {
                          setSelectedToolId(tool.id);
                          setQuickViewToolId(null);
                        }}
                        className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20"
                      >
                        Full Details
                      </button>
                      <a 
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-1 py-4 rounded-2xl font-bold border transition-all flex items-center justify-center gap-2 ${
                          isDarkMode ? 'border-zinc-800 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-50'
                        }`}
                      >
                        Visit Website
                        <ExternalLink size={18} />
                      </a>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

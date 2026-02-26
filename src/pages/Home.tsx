import React, { useState, useMemo } from 'react';
import { 
  Search, 
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
  Megaphone,
  Palette,
  PenTool,
  Database,
  Music,
  GraduationCap,
  CheckCircle2,
  ThumbsUp,
  Share2,
  ArrowLeftRight,
  Mail,
  TrendingUp,
  Award,
  Send,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AITool, Category, Pricing, SortOption, UserData } from '../types';
import { TOOLS_DATA } from '../toolsData';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface HomeProps {
  userData: UserData;
  toggleFavorite: (toolId: string) => void;
  toggleCompare: (toolId: string) => void;
  compareList: string[];
  handleShare: (tool: AITool) => void;
  setSelectedToolId: (id: string | null) => void;
  getToolStats: (toolId: string) => { rating: number; count: number };
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isFirebaseConfigured: boolean;
  showToast: (msg: string, type?: any) => void;
}

const ToolLogo = ({ src, name, className = "" }: { src: string, name: string, className?: string }) => {
  const [error, setError] = useState(false);
  if (error || !src) {
    return (
      <div className={`flex items-center justify-center bg-indigo-600 text-white font-bold text-xl ${className}`}>
        {name.charAt(0)}
      </div>
    );
  }
  return (
    <img 
      src={src} 
      alt={name} 
      className={`object-cover ${className}`} 
      onError={() => setError(true)}
    />
  );
};

const CategoryIcon = ({ category }: { category: Category }) => {
  switch (category) {
    case 'Chat AI': return <MessageSquare size={14} />;
    case 'Image Generation': return <ImageIcon size={14} />;
    case 'Video AI': return <Video size={14} />;
    case 'Coding AI': return <Code size={14} />;
    case 'Voice AI': return <Mic2 size={14} />;
    case 'Productivity AI': return <Sparkles size={14} />;
    case 'Marketing AI': return <Megaphone size={14} />;
    case 'Design AI': return <Palette size={14} />;
    case 'Writing AI': return <PenTool size={14} />;
    case 'Data AI': return <Database size={14} />;
    case 'Music AI': return <Music size={14} />;
    case 'Education AI': return <GraduationCap size={14} />;
    default: return <Zap size={14} />;
  }
};

const Home: React.FC<HomeProps> = ({ 
  userData, 
  toggleFavorite, 
  toggleCompare, 
  compareList, 
  handleShare,
  setSelectedToolId,
  getToolStats,
  searchQuery,
  setSearchQuery,
  isFirebaseConfigured,
  showToast
}) => {
  const { isDarkMode } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [selectedPricing, setSelectedPricing] = useState<Pricing | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortOption>('Most Popular');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [showDealsOnly, setShowDealsOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const TOOLS_PER_PAGE = 12;

  const categories: (Category | 'All')[] = [
    'All', 'Chat AI', 'Image Generation', 'Video AI', 'Coding AI', 'Voice AI', 
    'Productivity AI', 'Marketing AI', 'Design AI', 'Writing AI', 'Data AI', 
    'Music AI', 'Education AI'
  ];

  const filteredTools = useMemo(() => {
    return TOOLS_DATA.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           tool.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;
      const matchesPricing = selectedPricing === 'All' || tool.pricing === selectedPricing;
      const matchesVerified = !showVerifiedOnly || tool.isVerified;
      const matchesDeals = !showDealsOnly || tool.hasDeals;
      return matchesSearch && matchesCategory && matchesPricing && matchesVerified && matchesDeals;
    }).sort((a, b) => {
      if (sortBy === 'Most Popular') return b.popularity - a.popularity;
      if (sortBy === 'Highest Rated') return getToolStats(b.id).rating - getToolStats(a.id).rating;
      if (sortBy === 'Newest') return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
      if (sortBy === 'Free First') {
        if (a.pricing === 'Free' && b.pricing !== 'Free') return -1;
        if (a.pricing !== 'Free' && b.pricing === 'Free') return 1;
        return 0;
      }
      return 0;
    });
  }, [searchQuery, selectedCategory, selectedPricing, showVerifiedOnly, showDealsOnly, sortBy, getToolStats]);

  const totalPages = Math.ceil(filteredTools.length / TOOLS_PER_PAGE);
  const paginatedTools = useMemo(() => {
    const start = (currentPage - 1) * TOOLS_PER_PAGE;
    return filteredTools.slice(start, start + TOOLS_PER_PAGE);
  }, [filteredTools, currentPage]);

  const trendingTools = useMemo(() => {
    return [...TOOLS_DATA].sort((a, b) => b.popularity - a.popularity).slice(0, 5);
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <section className="text-center mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-black uppercase tracking-widest mb-6"
        >
          <Sparkles size={14} />
          Discover the Future of AI
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl sm:text-7xl font-black mb-6 tracking-tight leading-none"
        >
          The Ultimate <span className="text-indigo-600">AI Tool</span> Directory
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`text-lg sm:text-xl max-w-2xl mx-auto mb-10 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
        >
          Explore over 500+ curated AI tools to supercharge your workflow, creativity, and productivity.
        </motion.p>
      </section>

      {/* Trending Section */}
      <section className="mb-20">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-black flex items-center gap-3">
            <TrendingUp className="text-indigo-600" />
            Trending Now
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {trendingTools.map((tool, i) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelectedToolId(tool.id)}
              className={`p-4 rounded-3xl border transition-all cursor-pointer group ${
                isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-indigo-500/50' : 'bg-white border-zinc-100 hover:border-indigo-600/50 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden">
                  <ToolLogo src={tool.logo} name={tool.name} className="w-full h-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate group-hover:text-indigo-600 transition-colors">{tool.name}</div>
                  <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{tool.category}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-yellow-400" fill="currentColor" />
                  <span className="text-xs font-bold">{getToolStats(tool.id).rating}</span>
                </div>
                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                  tool.pricing === 'Free' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'
                }`}>
                  {tool.pricing}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Main Directory */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:w-64 space-y-8">
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest opacity-40 mb-4">Categories</h4>
            <div className="flex flex-wrap lg:flex-col gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    selectedCategory === cat 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                      : isDarkMode ? 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800' : 'bg-white text-zinc-500 hover:bg-zinc-100 border border-zinc-100'
                  }`}
                >
                  {cat === 'All' ? <LayoutGrid size={16} /> : <CategoryIcon category={cat as Category} />}
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-widest opacity-40 mb-4">Pricing</h4>
            <div className="flex flex-wrap lg:flex-col gap-2">
              {['All', 'Free', 'Freemium', 'Paid'].map(p => (
                <button
                  key={p}
                  onClick={() => setSelectedPricing(p as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    selectedPricing === p 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                      : isDarkMode ? 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800' : 'bg-white text-zinc-500 hover:bg-zinc-100 border border-zinc-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest opacity-40 mb-2">Options</h4>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div 
                onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
                className={`w-10 h-6 rounded-full transition-all relative ${showVerifiedOnly ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-800'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${showVerifiedOnly ? 'left-5' : 'left-1'}`} />
              </div>
              <span className="text-sm font-bold opacity-60 group-hover:opacity-100 transition-opacity">Verified Only</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div 
                onClick={() => setShowDealsOnly(!showDealsOnly)}
                className={`w-10 h-6 rounded-full transition-all relative ${showDealsOnly ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-800'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${showDealsOnly ? 'left-5' : 'left-1'}`} />
              </div>
              <span className="text-sm font-bold opacity-60 group-hover:opacity-100 transition-opacity">Deals Active</span>
            </label>
          </div>
        </aside>

        {/* Tools Grid */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <h3 className="text-2xl font-black">
              {selectedCategory === 'All' ? 'All AI Tools' : selectedCategory}
              <span className="ml-3 text-sm font-bold opacity-40">{filteredTools.length} results</span>
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold opacity-40 uppercase tracking-widest">Sort by:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className={`px-4 py-2 rounded-xl text-sm font-bold outline-none border ${
                  isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'
                }`}
              >
                <option value="Most Popular">Most Popular</option>
                <option value="Highest Rated">Highest Rated</option>
                <option value="Newest">Newest</option>
                <option value="Free First">Free First</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {paginatedTools.map((tool, i) => (
                <motion.div
                  key={tool.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: (i % 12) * 0.05 }}
                  onClick={() => setSelectedToolId(tool.id)}
                  className={`group relative flex flex-col rounded-[2.5rem] border transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer overflow-hidden ${
                    isDarkMode 
                      ? 'bg-zinc-900 border-zinc-800 hover:border-indigo-500/50 hover:shadow-indigo-500/10' 
                      : 'bg-white border-zinc-100 hover:border-indigo-200 hover:shadow-indigo-500/10'
                  }`}
                >
                  <div className="p-8 flex-1">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-lg">
                        <ToolLogo src={tool.logo} name={tool.name} className="w-full h-full" />
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
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(tool);
                            }}
                            className="p-2 rounded-full bg-zinc-500/10 text-zinc-500 hover:bg-indigo-500/10 hover:text-indigo-500 transition-all"
                          >
                            <Share2 size={16} />
                          </button>
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
                            <Heart size={16} fill={userData.favorites.includes(tool.id) ? "currentColor" : "none"} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                          tool.pricing === 'Free' ? 'bg-emerald-500/10 text-emerald-500' :
                          tool.pricing === 'Freemium' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-indigo-500/10 text-indigo-500'
                        }`}>
                          {tool.pricing}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-bold opacity-40 uppercase tracking-widest">
                          <CategoryIcon category={tool.category} />
                          {tool.category}
                        </div>
                      </div>
                      <h4 className="text-xl font-black group-hover:text-indigo-600 transition-colors">{tool.name}</h4>
                    </div>

                    <p className={`text-sm line-clamp-2 mb-6 leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      {tool.description}
                    </p>

                    <div className="flex items-center justify-between pt-6 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-yellow-400" fill="currentColor" />
                        <span className="font-black text-sm">{getToolStats(tool.id).rating}</span>
                        <span className="text-[10px] opacity-40 font-bold ml-1">({getToolStats(tool.id).count})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCompare(tool.id);
                          }}
                          className={`p-2 rounded-xl transition-all ${
                            compareList.includes(tool.id) 
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                              : 'bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500/20'
                          }`}
                        >
                          <ArrowLeftRight size={14} />
                        </button>
                        <div className="p-2 rounded-xl bg-indigo-600 text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg shadow-indigo-600/20">
                          <ExternalLink size={14} />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-30 ${
                  isDarkMode ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-white border border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                Prev
              </button>
              <div className="flex gap-2">
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  if (totalPages > 5) {
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
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-30 ${
                  isDarkMode ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-white border border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

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
                showToast('Successfully subscribed!', 'success');
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
      </section>
    </main>
  );
};

export default Home;

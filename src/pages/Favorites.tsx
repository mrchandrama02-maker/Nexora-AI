import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Heart, 
  ArrowLeft, 
  ExternalLink, 
  Star,
  Trash2,
  Share2,
  CheckCircle2,
  Zap,
  ArrowLeftRight,
  MessageSquare,
  Image as ImageIcon,
  Video,
  Code,
  Mic2,
  Sparkles,
  Megaphone,
  Palette,
  PenTool,
  Database,
  Music,
  GraduationCap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { TOOLS_DATA } from '../toolsData';
import { AITool, UserData, Category } from '../types';

interface FavoritesProps {
  userData: UserData;
  toggleFavorite: (toolId: string) => void;
  setSelectedToolId: (id: string | null) => void;
  getToolStats: (toolId: string) => { rating: number; count: number };
  handleShare: (tool: AITool) => void;
  toggleCompare: (toolId: string) => void;
  compareList: string[];
}

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

const Favorites: React.FC<FavoritesProps> = ({ 
  userData, 
  toggleFavorite, 
  setSelectedToolId,
  getToolStats,
  handleShare,
  toggleCompare,
  compareList
}) => {
  const { isDarkMode } = useTheme();
  
  const favoriteTools = useMemo(() => {
    return TOOLS_DATA.filter(t => userData.favorites.includes(t.id));
  }, [userData.favorites]);

  return (
    <div className={`min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <div>
            <Link 
              to="/" 
              className={`inline-flex items-center gap-2 mb-4 text-sm font-bold transition-colors ${
                isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <ArrowLeft size={16} />
              Back to Directory
            </Link>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
              <Heart className="text-pink-500" fill="currentColor" />
              My Favorites
            </h1>
          </div>
          <div className={`px-6 py-3 rounded-2xl border font-bold ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'
          }`}>
            {favoriteTools.length} Tools Saved
          </div>
        </div>

        {favoriteTools.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-20 text-center rounded-[3rem] border ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'
            }`}
          >
            <div className="w-20 h-20 bg-pink-500/10 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-2">No favorites yet</h3>
            <p className="opacity-50 max-w-xs mx-auto mb-8">
              Start exploring the directory and save your favorite AI tools to access them quickly later.
            </p>
            <Link 
              to="/" 
              className="inline-flex px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20"
            >
              Explore Tools
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {favoriteTools.map((tool, i) => (
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
        )}
      </div>
    </div>
  );
};

export default Favorites;

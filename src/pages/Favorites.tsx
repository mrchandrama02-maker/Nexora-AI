import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Heart, 
  ArrowLeft, 
  ExternalLink, 
  Star,
  Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { TOOLS_DATA } from '../toolsData';
import { AITool, UserData } from '../types';

interface FavoritesProps {
  userData: UserData;
  toggleFavorite: (toolId: string) => void;
  setSelectedToolId: (id: string | null) => void;
  getToolStats: (toolId: string) => { rating: number; count: number };
}

const Favorites: React.FC<FavoritesProps> = ({ 
  userData, 
  toggleFavorite, 
  setSelectedToolId,
  getToolStats
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
              {favoriteTools.map((tool) => (
                <motion.div
                  key={tool.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`group relative flex flex-col rounded-[2.5rem] border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer overflow-hidden ${
                    isDarkMode 
                      ? 'bg-zinc-900 border-zinc-800 hover:border-indigo-500/50' 
                      : 'bg-white border-zinc-100 hover:border-indigo-200'
                  }`}
                  onClick={() => setSelectedToolId(tool.id)}
                >
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
                        <img src={tool.logo} alt={tool.name} className="w-full h-full object-cover" />
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(tool.id);
                        }}
                        className="p-2 rounded-full bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                        title="Remove from Favorites"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <h4 className="text-xl font-black mb-2 group-hover:text-indigo-600 transition-colors">{tool.name}</h4>
                    <p className={`text-sm line-clamp-2 mb-6 leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      {tool.description}
                    </p>

                    <div className="flex items-center justify-between pt-6 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-yellow-400" fill="currentColor" />
                        <span className="font-black text-sm">{getToolStats(tool.id).rating}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-indigo-600 text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg shadow-indigo-600/20">
                        <ExternalLink size={14} />
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

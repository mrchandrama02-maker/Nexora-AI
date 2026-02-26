import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Moon, 
  Sun, 
  User, 
  LogOut, 
  Heart, 
  ChevronDown,
  LayoutDashboard,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setShowSubmitModal: (show: boolean) => void;
  setShowAuthModal: (show: boolean) => void;
  setShowAdminDashboard: (show: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  searchQuery, 
  setSearchQuery, 
  setShowSubmitModal, 
  setShowAuthModal,
  setShowAdminDashboard
}) => {
  const { user, logout, isConfigured } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
    navigate('/');
  };

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
      isDarkMode ? 'bg-zinc-950/80 border-zinc-800' : 'bg-white/80 border-zinc-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">AI</div>
          <h1 className="text-xl font-bold tracking-tight hidden sm:block">Nexora AI</h1>
        </Link>

        <div className="flex-1 max-w-md mx-4">
          <div className="relative group">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
              isDarkMode ? 'text-zinc-500 group-focus-within:text-indigo-400' : 'text-zinc-400 group-focus-within:text-indigo-600'
            }`} size={18} />
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

        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={toggleDarkMode}
            className={`p-2 rounded-xl transition-all ${
              isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'
            }`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button 
            onClick={() => setShowSubmitModal(true)}
            className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              isDarkMode ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-100' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900'
            }`}
          >
            <Plus size={16} />
            Submit
          </button>
          
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800 group"
              >
                <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-indigo-600/20 group-hover:border-indigo-600/50 transition-all">
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                </div>
                <ChevronDown size={16} className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''} opacity-40`} />
              </button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={`absolute right-0 mt-2 w-64 rounded-3xl shadow-2xl border overflow-hidden ${
                      isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'
                    }`}
                  >
                    <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                      <p className="text-sm font-black truncate">{user.name}</p>
                      <p className="text-xs opacity-50 truncate">{user.email}</p>
                    </div>
                    <div className="p-2">
                      <Link 
                        to="/profile" 
                        onClick={() => setShowDropdown(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                          isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50'
                        }`}
                      >
                        <User size={18} className="opacity-50" />
                        My Profile
                      </Link>
                      <Link 
                        to="/favorites" 
                        onClick={() => setShowDropdown(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                          isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50'
                        }`}
                      >
                        <Heart size={18} className="opacity-50" />
                        My Favorites
                      </Link>
                      {user.role === 'admin' && (
                        <button 
                          onClick={() => {
                            setShowDropdown(false);
                            setShowAdminDashboard(true);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                            isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50'
                          }`}
                        >
                          <LayoutDashboard size={18} className="opacity-50" />
                          Admin Panel
                        </button>
                      )}
                    </div>
                    <div className="p-2 border-t border-zinc-100 dark:border-zinc-800">
                      <button 
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-rose-500 transition-all ${
                          isDarkMode ? 'hover:bg-rose-500/10' : 'hover:bg-rose-50'
                        }`}
                      >
                        <LogOut size={18} />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              disabled={!isConfigured}
              className={`flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-black transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <User size={18} />
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

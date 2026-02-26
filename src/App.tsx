/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, useCallback, FormEvent } from 'react';
import { 
  Search, 
  Zap,
  Star,
  Loader2,
  CheckCircle2,
  XCircle,
  Info,
  ArrowLeftRight,
  Plus,
  X,
  Settings,
  Users,
  BarChart3,
  Mail,
  ExternalLink,
  Heart,
  ThumbsUp,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// Contexts
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Components
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';

// Services & Data
import { TOOLS_DATA } from './toolsData';
import { auth, db, isFirebaseConfigured } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  collection, 
  onSnapshot,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';

// Types
import { AITool, Category, Pricing, SortOption, UserData, User, Review } from './types';

// --- Modals & Sub-components ---

const AuthModal = ({ isOpen, onClose, showToast }: { isOpen: boolean, onClose: () => void, showToast: (msg: string, type?: any) => void }) => {
  const { isDarkMode } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured) {
      showToast('Firebase is not configured. Please check your environment variables.', 'error');
      return;
    }
    setLoading(true);
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Successfully signed in!', 'success');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: name,
          photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
        });
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name,
          email,
          role: 'user',
          createdAt: Timestamp.now(),
          ratings: {},
          submittedTools: []
        });
        
        showToast('Account created successfully!', 'success');
      }
      onClose();
    } catch (error: any) {
      console.error('Auth error:', error);
      showToast(error.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (providerName: 'google' | 'github') => {
    if (!isFirebaseConfigured) {
      showToast('Firebase is not configured', 'error');
      return;
    }
    const provider = providerName === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          name: user.displayName || 'User',
          email: user.email,
          role: 'user',
          createdAt: Timestamp.now(),
          ratings: {},
          submittedTools: []
        });
      }
      
      showToast(`Welcome, ${user.displayName}!`, 'success');
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Social login failed', 'error');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`relative w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl overflow-hidden ${
              isDarkMode ? 'bg-zinc-900 text-white border border-zinc-800' : 'bg-white text-zinc-900'
            }`}
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-right from-indigo-500 via-purple-500 to-pink-500" />
            
            <button 
              onClick={onClose}
              className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${
                isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'
              }`}
            >
              <X size={20} />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-xl shadow-indigo-600/20">
                AI
              </div>
              <h2 className="text-3xl font-black tracking-tight mb-2">
                {isLogin ? 'Welcome Back' : 'Join Nexora AI'}
              </h2>
              <p className="text-sm opacity-60">
                {isLogin ? 'Sign in to access your saved tools' : 'Create an account to start curating your AI toolkit'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-60 ml-1">Full Name</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className={`w-full pl-12 pr-4 py-3 rounded-2xl outline-none transition-all border-2 ${
                        isDarkMode 
                          ? 'bg-zinc-800 border-zinc-700 focus:border-indigo-500' 
                          : 'bg-zinc-50 border-zinc-100 focus:border-indigo-600'
                      }`}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider opacity-60 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={`w-full pl-12 pr-4 py-3 rounded-2xl outline-none transition-all border-2 ${
                      isDarkMode 
                        ? 'bg-zinc-800 border-zinc-700 focus:border-indigo-500' 
                        : 'bg-zinc-50 border-zinc-100 focus:border-indigo-600'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider opacity-60 ml-1">Password</label>
                <div className="relative">
                  <Zap className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-12 pr-4 py-3 rounded-2xl outline-none transition-all border-2 ${
                      isDarkMode 
                        ? 'bg-zinc-800 border-zinc-700 focus:border-indigo-500' 
                        : 'bg-zinc-50 border-zinc-100 focus:border-indigo-600'
                    }`}
                  />
                </div>
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <Zap size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm opacity-60 mb-4">Or continue with</p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => handleSocialLogin('google')}
                  className={`p-3 rounded-2xl border-2 transition-all ${isDarkMode ? 'bg-zinc-800 border-zinc-700 hover:border-zinc-500' : 'bg-white border-zinc-100 hover:border-zinc-200'}`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </button>
                <button 
                  onClick={() => handleSocialLogin('github')}
                  className={`p-3 rounded-2xl border-2 transition-all ${isDarkMode ? 'bg-zinc-800 border-zinc-700 hover:border-zinc-500' : 'bg-white border-zinc-100 hover:border-zinc-200'}`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.341-3.369-1.341-.454-1.152-1.11-1.459-1.11-1.459-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.137 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const AdminDashboard = ({ onClose }: { onClose: () => void }) => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'newsletter' | 'tools'>('overview');
  const [stats, setStats] = useState({ users: 0, tools: 0, newsletter: 0 });
  const [newsletter, setNewsletter] = useState<{ id: string, email: string, date: any }[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const unsubscribeNewsletter = onSnapshot(collection(db, 'newsletter'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setNewsletter(data);
      setStats(prev => ({ ...prev, newsletter: data.length }));
    });

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setUsers(data);
      setStats(prev => ({ ...prev, users: data.length }));
    });

    setStats(prev => ({ ...prev, tools: TOOLS_DATA.length }));

    return () => {
      unsubscribeNewsletter();
      unsubscribeUsers();
    };
  }, []);

  return (
    <div className={`fixed inset-0 z-[150] flex flex-col ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'}`}>
      <header className={`h-20 border-b flex items-center justify-between px-8 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">AD</div>
          <h2 className="text-xl font-black tracking-tight">Admin Dashboard</h2>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-500/10 transition-colors">
          <X size={24} />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className={`w-64 border-r p-6 space-y-2 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
          {[
            { id: 'overview', label: 'Overview', icon: <BarChart3 size={18} /> },
            { id: 'users', label: 'Users', icon: <Users size={18} /> },
            { id: 'newsletter', label: 'Newsletter', icon: <Mail size={18} /> },
            { id: 'tools', label: 'Tools', icon: <Settings size={18} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'hover:bg-zinc-500/10 opacity-60 hover:opacity-100'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </aside>

        <main className="flex-1 overflow-y-auto p-10">
          {activeTab === 'overview' && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Total Users', value: stats.users, icon: <Users />, color: 'text-blue-500' },
                  { label: 'Newsletter Subscriptions', value: stats.newsletter, icon: <Mail />, color: 'text-emerald-500' },
                  { label: 'Total Tools', value: stats.tools, icon: <Settings />, color: 'text-indigo-500' },
                ].map((stat, i) => (
                  <div key={i} className={`p-8 rounded-[2.5rem] border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
                    <div className={`w-12 h-12 rounded-2xl bg-zinc-500/10 flex items-center justify-center mb-4 ${stat.color}`}>
                      {stat.icon}
                    </div>
                    <div className="text-3xl font-black mb-1">{stat.value}</div>
                    <div className="text-xs font-bold uppercase tracking-widest opacity-40">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'newsletter' && (
            <div className={`rounded-[2.5rem] border overflow-hidden ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
              <table className="w-full text-left">
                <thead>
                  <tr className={`border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                    <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest opacity-40">Email</th>
                    <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest opacity-40">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {newsletter.map(item => (
                    <tr key={item.id} className={`border-b last:border-0 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                      <td className="px-8 py-5 font-bold">{item.email}</td>
                      <td className="px-8 py-5 opacity-60">{item.date?.toDate().toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'users' && (
            <div className={`rounded-[2.5rem] border overflow-hidden ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
              <table className="w-full text-left">
                <thead>
                  <tr className={`border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                    <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest opacity-40">Name</th>
                    <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest opacity-40">Email</th>
                    <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest opacity-40">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className={`border-b last:border-0 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                      <td className="px-8 py-5 font-bold">{user.name}</td>
                      <td className="px-8 py-5 opacity-60">{user.email}</td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'}`}>
                          {user.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
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

// --- Main App Component ---

const AppContent = () => {
  const { user, loading, isConfigured } = useAuth();
  const { isDarkMode } = useTheme();
  const location = useLocation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [userData, setUserData] = useState<UserData>({
    user: null,
    favorites: [],
    ratings: {},
    reviews: [],
    submittedTools: []
  });
  
  const [compareList, setCompareList] = useState<string[]>([]);
  const [showCompareView, setShowCompareView] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [quickViewToolId, setQuickViewToolId] = useState<string | null>(null);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' | 'error' }[]>([]);
  const [submissionForm, setSubmissionForm] = useState({ name: '', url: '', category: 'Chat AI' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  // Sync userData with AuthContext
  useEffect(() => {
    if (user) {
      setUserData(prev => ({
        ...prev,
        user: user,
        favorites: user.favorites || [],
        ratings: user.ratings || {}
      }));
    } else {
      setUserData(prev => ({
        ...prev,
        user: null,
        favorites: [],
        ratings: {}
      }));
    }
  }, [user]);

  // Handle Auth Modal from Protected Route redirect
  useEffect(() => {
    if (location.state?.openAuth) {
      setShowAuthModal(true);
      // Clear state to avoid reopening
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Real-time Reviews Listener
  useEffect(() => {
    if (!isConfigured) return;
    const q = query(collection(db, 'reviews'), orderBy('date', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate().toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
      } as Review));
      setUserData(prev => ({ ...prev, reviews: reviewsData }));
    });
    return () => unsubscribe();
  }, [isConfigured]);

  const toggleFavorite = async (toolId: string) => {
    if (!isConfigured) {
      showToast('Firebase is not configured', 'error');
      return;
    }
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const isFavorite = userData.favorites.includes(toolId);
    const favRef = doc(db, 'users', user.id, 'favorites', toolId);
    
    try {
      if (isFavorite) {
        await deleteDoc(favRef);
        showToast('Removed from favorites', 'info');
      } else {
        const tool = TOOLS_DATA.find(t => t.id === toolId);
        if (!tool) return;

        await setDoc(favRef, {
          toolId: tool.id,
          name: tool.name,
          category: tool.category,
          pricing: tool.pricing,
          image: tool.logo,
          createdAt: serverTimestamp()
        });
        showToast('Added to favorites!', 'success');
      }
    } catch (error: any) {
      console.error("Error updating favorites:", error);
      if (error.code === 'permission-denied') {
        showToast('Permission denied. Please check your account.', 'error');
      } else {
        showToast('Failed to update favorites', 'error');
      }
    }
  };

  const toggleCompare = (toolId: string) => {
    setCompareList(prev => 
      prev.includes(toolId) 
        ? prev.filter(id => id !== toolId) 
        : prev.length < 3 ? [...prev, toolId] : prev
    );
  };

  const handleShare = (tool: AITool) => {
    const shareUrl = `${window.location.origin}/?tool=${tool.id}`;
    if (navigator.share) {
      navigator.share({
        title: tool.name,
        text: tool.description,
        url: shareUrl,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareUrl);
      showToast('Link copied to clipboard!', 'success');
    }
  };

  const handleToolSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      showToast('Firebase is not configured', 'error');
      return;
    }
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!submissionForm.name || !submissionForm.url) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'submissions'), {
        ...submissionForm,
        userId: user.id,
        userName: user.name,
        status: 'pending',
        date: Timestamp.now()
      });
      showToast('Thanks for the submission! Our team will review it soon.', 'success');
      setShowSubmitModal(false);
      setSubmissionForm({ name: '', url: '', category: 'Chat AI' });
    } catch (error) {
      showToast('Failed to submit tool', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      {!isConfigured && (
        <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-bold flex items-center justify-center gap-2">
          <Info size={16} />
          Firebase is not configured. Some features (Login, Favorites, Reviews) will be disabled. 
          <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="underline ml-2">Setup Firebase</a>
        </div>
      )}

      <Header 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setShowSubmitModal={setShowSubmitModal}
        setShowAuthModal={setShowAuthModal}
        setShowAdminDashboard={setShowAdminDashboard}
      />

      <Routes>
        <Route path="/" element={
          <Home 
            userData={userData}
            toggleFavorite={toggleFavorite}
            toggleCompare={toggleCompare}
            compareList={compareList}
            handleShare={handleShare}
            setSelectedToolId={setSelectedToolId}
            getToolStats={getToolStats}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isFirebaseConfigured={isConfigured}
            showToast={showToast}
          />
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile isDarkMode={isDarkMode} />
          </ProtectedRoute>
        } />
        <Route path="/favorites" element={
          <ProtectedRoute>
            <Favorites 
              userData={userData}
              toggleFavorite={toggleFavorite}
              setSelectedToolId={setSelectedToolId}
              getToolStats={getToolStats}
              handleShare={handleShare}
              toggleCompare={toggleCompare}
              compareList={compareList}
            />
          </ProtectedRoute>
        } />
      </Routes>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        showToast={showToast}
      />

      {showAdminDashboard && (
        <AdminDashboard 
          onClose={() => setShowAdminDashboard(false)} 
        />
      )}

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
              <form onSubmit={handleToolSubmit} className="p-8 space-y-6">
                <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Found a great AI tool that's missing from our directory? Let us know!
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2 opacity-50">Tool Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. ChatGPT"
                      value={submissionForm.name}
                      onChange={(e) => setSubmissionForm(prev => ({ ...prev, name: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-2xl border outline-none transition-all ${
                        isDarkMode ? 'bg-zinc-900 border-zinc-800 focus:border-indigo-500' : 'bg-zinc-50 border-zinc-100 focus:border-indigo-600'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2 opacity-50">Website URL</label>
                    <input 
                      type="url" 
                      required
                      placeholder="https://..."
                      value={submissionForm.url}
                      onChange={(e) => setSubmissionForm(prev => ({ ...prev, url: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-2xl border outline-none transition-all ${
                        isDarkMode ? 'bg-zinc-900 border-zinc-800 focus:border-indigo-500' : 'bg-zinc-50 border-zinc-100 focus:border-indigo-600'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2 opacity-50">Category</label>
                    <select 
                      value={submissionForm.category}
                      onChange={(e) => setSubmissionForm(prev => ({ ...prev, category: e.target.value as Category }))}
                      className={`w-full px-4 py-3 rounded-2xl border outline-none transition-all appearance-none ${
                        isDarkMode ? 'bg-zinc-900 border-zinc-800 focus:border-indigo-500' : 'bg-zinc-50 border-zinc-100 focus:border-indigo-600'
                      }`}
                    >
                      {[
                        'Chat AI', 'Image Generation', 'Video AI', 'Coding AI', 'Voice AI', 
                        'Productivity AI', 'Marketing AI', 'Design AI', 'Writing AI', 'Data AI', 
                        'Music AI', 'Education AI'
                      ].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Submit for Review'}
                </button>
              </form>
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

      {/* Full Details Modal */}
      <AnimatePresence>
        {selectedToolId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6"
          >
            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md" onClick={() => setSelectedToolId(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] border shadow-2xl ${
                isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'
              }`}
            >
              <button 
                onClick={() => setSelectedToolId(null)}
                className="absolute top-8 right-8 p-3 rounded-full hover:bg-zinc-500/10 transition-colors z-10"
              >
                <X size={28} />
              </button>

              {(() => {
                const tool = TOOLS_DATA.find(t => t.id === selectedToolId);
                if (!tool) return null;
                return (
                  <div className="p-8 sm:p-16">
                    <div className="flex flex-col md:flex-row gap-12 mb-12">
                      <div className="w-48 h-48 rounded-[3rem] overflow-hidden border-8 border-white dark:border-zinc-800 shadow-2xl flex-shrink-0 mx-auto md:mx-0">
                        <ToolLogo src={tool.logo} name={tool.name} className="w-full h-full" />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-6">
                          <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-black uppercase tracking-widest">{tool.category}</span>
                          {tool.isVerified && (
                            <span className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-black uppercase tracking-widest">
                              <CheckCircle2 size={14} />
                              Verified Tool
                            </span>
                          )}
                        </div>
                        <h2 className="text-5xl font-black mb-4 tracking-tight leading-none">{tool.name}</h2>
                        <div className="flex items-center justify-center md:justify-start gap-4 mb-8">
                          <div className="flex items-center gap-2">
                            <Star size={20} className="text-yellow-400" fill="currentColor" />
                            <span className="text-xl font-black">{getToolStats(tool.id).rating}</span>
                          </div>
                          <span className="text-sm opacity-40 font-bold uppercase tracking-widest">Based on {getToolStats(tool.id).count} user reviews</span>
                        </div>
                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                          <a 
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-2"
                          >
                            Visit Official Website
                            <ExternalLink size={20} />
                          </a>
                          <button 
                            onClick={() => toggleFavorite(tool.id)}
                            className={`px-8 py-4 rounded-2xl font-black border transition-all flex items-center gap-2 ${
                              userData.favorites.includes(tool.id)
                                ? 'bg-pink-500/10 border-pink-500/20 text-pink-500'
                                : isDarkMode ? 'border-zinc-800 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-50'
                            }`}
                          >
                            <Heart size={20} fill={userData.favorites.includes(tool.id) ? "currentColor" : "none"} />
                            {userData.favorites.includes(tool.id) ? 'Saved to Favorites' : 'Save to Favorites'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                      <div className="lg:col-span-2 space-y-12">
                        <section>
                          <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                            <Info className="text-indigo-600" />
                            About {tool.name}
                          </h3>
                          <p className={`text-xl leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                            {tool.description}
                          </p>
                        </section>

                        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className={`p-8 rounded-[2.5rem] border ${isDarkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-emerald-50 border-emerald-100'}`}>
                            <h4 className="text-lg font-black mb-6 text-emerald-600 flex items-center gap-2">
                              <ThumbsUp size={20} />
                              Pros
                            </h4>
                            <ul className="space-y-4">
                              {tool.pros?.map((pro, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm font-bold opacity-80">
                                  <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                                  {pro}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className={`p-8 rounded-[2.5rem] border ${isDarkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-rose-50 border-rose-100'}`}>
                            <h4 className="text-lg font-black mb-6 text-rose-600 flex items-center gap-2">
                              <XCircle size={20} />
                              Cons
                            </h4>
                            <ul className="space-y-4">
                              {tool.cons?.map((con, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm font-bold opacity-80">
                                  <XCircle size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
                                  {con}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </section>

                        <section>
                          <h3 className="text-2xl font-black mb-6">Key Features</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {tool.features?.map((feature, i) => (
                              <div key={i} className={`p-6 rounded-2xl border flex items-center gap-4 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center flex-shrink-0">
                                  <Zap size={20} />
                                </div>
                                <span className="font-bold">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </section>
                      </div>

                      <div className="space-y-8">
                        <div className={`p-8 rounded-[2.5rem] border ${isDarkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                          <h4 className="text-xs font-black uppercase tracking-widest opacity-40 mb-6">Pricing Details</h4>
                          <div className="space-y-6">
                            <div>
                              <div className="text-2xl font-black text-indigo-600 mb-1">{tool.pricing}</div>
                              <div className="text-sm font-bold opacity-60">{tool.pricingDetails || 'Standard industry pricing'}</div>
                            </div>
                            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                              <div className="text-xs font-black uppercase tracking-widest opacity-40 mb-3">Best For</div>
                              <div className="flex flex-wrap gap-2">
                                {tool.useCases?.map((useCase, i) => (
                                  <span key={i} className="px-3 py-1 rounded-lg bg-zinc-500/10 text-[10px] font-black uppercase tracking-widest">
                                    {useCase}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className={`p-8 rounded-[2.5rem] border ${isDarkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                          <h4 className="text-xs font-black uppercase tracking-widest opacity-40 mb-6">Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {tool.tags?.map((tag, i) => (
                              <span key={i} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-white border border-zinc-200 text-zinc-500'
                              }`}>
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
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
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

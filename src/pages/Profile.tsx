import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  IdCard, 
  CheckCircle2, 
  XCircle,
  ArrowLeft,
  RefreshCw,
  Send
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Profile: React.FC<{ isDarkMode: boolean, showToast: (msg: string, type?: any) => void }> = ({ isDarkMode, showToast }) => {
  const { user, firebaseUser, refreshUser, resendVerification } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);

  if (!user || !firebaseUser) return null;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUser();
      showToast('Status refreshed!', 'info');
    } catch (error: any) {
      showToast(error.message || 'Failed to refresh status', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleResend = async () => {
    setSending(true);
    try {
      await resendVerification();
      showToast('Verification email sent!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to send email', 'error');
    } finally {
      setSending(false);
    }
  };

  const creationDate = firebaseUser.metadata.creationTime 
    ? new Date(firebaseUser.metadata.creationTime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Unknown';

  return (
    <div className={`min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      <div className="max-w-4xl mx-auto">
        <Link 
          to="/" 
          className={`inline-flex items-center gap-2 mb-8 text-sm font-bold transition-colors ${
            isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <ArrowLeft size={16} />
          Back to Directory
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-[3rem] overflow-hidden border shadow-2xl ${
            isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'
          }`}
        >
          {/* Cover / Header */}
          <div className="h-32 bg-indigo-600 relative">
            <div className="absolute -bottom-16 left-8 sm:left-12">
              <div className="w-32 h-32 rounded-[2.5rem] border-4 border-white dark:border-zinc-900 overflow-hidden shadow-2xl bg-white">
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="pt-20 pb-12 px-8 sm:px-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
              <div>
                <h1 className="text-4xl font-black tracking-tight mb-2">{user.name}</h1>
                <p className={`text-lg font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {user.email}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest ${
                  user.role === 'admin' 
                    ? 'bg-indigo-500/10 text-indigo-500' 
                    : 'bg-zinc-500/10 text-zinc-500'
                }`}>
                  {user.role} Account
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                  <IdCard size={20} className="text-indigo-500" />
                  Account Details
                </h3>
                
                <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail size={18} className="opacity-40" />
                        <span className="text-sm font-bold opacity-60">Email</span>
                      </div>
                      <span className="text-sm font-bold">{user.email}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Shield size={18} className="opacity-40" />
                        <span className="text-sm font-bold opacity-60">Verification</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.emailVerified ? (
                          <>
                            <CheckCircle2 size={16} className="text-emerald-500" />
                            <span className="text-sm font-bold text-emerald-500">Verified ✅</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={16} className="text-rose-500" />
                            <span className="text-sm font-bold text-rose-500">Unverified ❌</span>
                          </>
                        )}
                      </div>
                    </div>

                    {!user.emailVerified && (
                      <div className="flex flex-col gap-2 pt-2">
                        <button 
                          onClick={handleResend}
                          disabled={sending}
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
                        >
                          <Send size={14} />
                          {sending ? 'Sending...' : 'Resend Verification Email'}
                        </button>
                        <button 
                          onClick={handleRefresh}
                          disabled={refreshing}
                          className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-bold transition-all disabled:opacity-50 ${
                            isDarkMode ? 'border-zinc-800 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-100'
                          }`}
                        >
                          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                          {refreshing ? 'Refreshing...' : 'Refresh Status'}
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar size={18} className="opacity-40" />
                        <span className="text-sm font-bold opacity-60">Joined</span>
                      </div>
                      <span className="text-sm font-bold">{creationDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                  <User size={20} className="text-indigo-500" />
                  Security
                </h3>
                
                <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                  <div className="space-y-4">
                    <button className="w-full py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-sm font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'user' | 'admin';
  createdAt?: any;
  favorites: string[];
  ratings: Record<string, number>;
}

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (fUser) => {
      setFirebaseUser(fUser);
      
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (fUser) {
        // Set initial user info from Auth
        setUser({
          id: fUser.uid,
          name: fUser.displayName || 'User',
          email: fUser.email || '',
          avatar: fUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fUser.email}`,
          role: 'user',
          favorites: [],
          ratings: {}
        });

        // Listen for Firestore updates
        unsubscribeDoc = onSnapshot(doc(db, 'users', fUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUser({
              id: fUser.uid,
              name: data.name || fUser.displayName || 'User',
              email: data.email || fUser.email || '',
              avatar: fUser.photoURL || data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
              role: data.role || 'user',
              createdAt: data.createdAt,
              favorites: data.favorites || [],
              ratings: data.ratings || {}
            });
          }
          setLoading(false);
        }, (error) => {
          console.error("Firestore error:", error);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const logout = async () => {
    if (!isFirebaseConfigured) return;
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, logout, isConfigured: isFirebaseConfigured }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

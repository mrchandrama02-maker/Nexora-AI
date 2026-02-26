import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signOut, 
  User as FirebaseUser,
  sendEmailVerification
} from 'firebase/auth';
import { doc, onSnapshot, collection } from 'firebase/firestore';
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
  emailVerified: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  resendVerification: () => Promise<void>;
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
    let unsubscribeFavs: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (fUser) => {
      setFirebaseUser(fUser);
      
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }
      if (unsubscribeFavs) {
        unsubscribeFavs();
        unsubscribeFavs = null;
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
          ratings: {},
          emailVerified: fUser.emailVerified
        });

        // Listen for Firestore updates
        unsubscribeDoc = onSnapshot(doc(db, 'users', fUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUser(prev => prev ? ({
              ...prev,
              name: data.name || fUser.displayName || 'User',
              email: data.email || fUser.email || '',
              avatar: fUser.photoURL || data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
              role: data.role || 'user',
              createdAt: data.createdAt,
              ratings: data.ratings || {},
              emailVerified: fUser.emailVerified
            }) : null);
          }
        }, (error) => {
          console.error("Firestore user error:", error);
        });

        // Listen for Favorites subcollection
        unsubscribeFavs = onSnapshot(collection(db, 'users', fUser.uid, 'favorites'), (snapshot) => {
          const favIds = snapshot.docs.map(doc => doc.id);
          setUser(prev => prev ? ({
            ...prev,
            favorites: favIds
          }) : null);
          setLoading(false);
        }, (error) => {
          console.error("Firestore favorites error:", error);
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
      if (unsubscribeFavs) unsubscribeFavs();
    };
  }, []);

  const logout = async () => {
    if (!isFirebaseConfigured) return;
    await signOut(auth);
  };

  const refreshUser = async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    const updatedUser = auth.currentUser;
    setFirebaseUser(updatedUser);
    setUser(prev => prev ? ({
      ...prev,
      emailVerified: updatedUser.emailVerified
    }) : null);
  };

  const resendVerification = async () => {
    if (!auth.currentUser) return;
    await sendEmailVerification(auth.currentUser);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      firebaseUser, 
      loading, 
      logout, 
      refreshUser,
      resendVerification,
      isConfigured: isFirebaseConfigured 
    }}>
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

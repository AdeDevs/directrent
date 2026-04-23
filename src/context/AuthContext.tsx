import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, ViewState, AuthMode, Listing, AppTab } from '../types';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { isProfileComplete } from '../lib/verification';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (role: UserRole, userData: Partial<User>) => void;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  view: ViewState;
  setView: (view: ViewState) => void;
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  preselectedRole: UserRole;
  setPreselectedRole: (role: UserRole) => void;
  currentListing: Listing | null;
  setCurrentListing: (listing: Listing | null) => void;
  selectedAgentId: string | null;
  setSelectedAgentId: (agentId: string | null) => void;
  favorites: number[];
  toggleFavorite: (listingId: number) => Promise<void>;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [view, setView] = useState<ViewState>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [preselectedRole, setPreselectedRole] = useState<UserRole>('tenant');
  const [currentListing, setCurrentListing] = useState<Listing | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<AppTab>('home');

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }

    // Subscribe to favorites subcollection
    const favsRef = collection(db, 'users', user.id, 'favorites');
    const unsubscribeFavs = onSnapshot(favsRef, (snapshot) => {
      const favIds = snapshot.docs.map(doc => parseInt(doc.id));
      setFavorites(favIds);
    });

    return () => unsubscribeFavs();
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser(userData);
            
            // Auto redirect based on new vs returning user profile completeness
            if (isProfileComplete(userData)) {
              setActiveTab('home');
            } else {
              setActiveTab('profile');
            }

            // Only switch to app view if we are on landing or auth pages
            if (sessionStorage.getItem('sms_reset_flow') !== 'active') {
              setView(prev => (prev === 'landing' || prev === 'auth') ? 'app' : prev);
            }
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(null);
        }
      } else {
        setUser(null);
        setView(prev => prev === 'app' ? 'landing' : prev);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []); // Remove [view] dependency for stability

  const login = (role: UserRole, userData: Partial<User>) => {
    // This is called after Firebase Auth success in Auth.tsx
    // to update the local state immediately
    if (userData && userData.id) {
       setUser(userData as User);
       if (isProfileComplete(userData)) {
         setActiveTab('home');
       } else {
         setActiveTab('profile');
       }
       setView('app');
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    try {
      // Use updateDoc to send ONLY the changed fields to Firestore
      // This is much more efficient than setDoc with the full user object
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, updates, { merge: true });
      
      // Update local state by merging
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setFavorites([]);
      setView('landing');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const toggleFavorite = async (listingId: number) => {
    if (!user) {
      setAuthMode('login');
      setView('auth');
      return;
    }

    const favDocRef = doc(db, 'users', user.id, 'favorites', listingId.toString());
    
    try {
      if (favorites.includes(listingId)) {
        await deleteDoc(favDocRef);
      } else {
        await setDoc(favDocRef, {
          listingId: listingId.toString(),
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!user,
      isLoading,
      user,
      login,
      logout,
      updateProfile,
      view,
      setView,
      authMode,
      setAuthMode,
      preselectedRole,
      setPreselectedRole,
      currentListing,
      setCurrentListing,
      selectedAgentId,
      setSelectedAgentId,
      favorites,
      toggleFavorite,
      activeTab,
      setActiveTab,
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

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, ViewState, AuthMode, Listing, AppTab } from '../types';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, deleteDoc, serverTimestamp, deleteField, updateDoc, FieldValue } from 'firebase/firestore';
import { isProfileComplete } from '../lib/verification';
import { useTheme } from './ThemeContext';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (role: UserRole, userData: Partial<User>) => void;
  logout: () => Promise<void>;
  updateProfile: (updates: any) => Promise<void>;
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
  favorites: (string | number)[];
  toggleFavorite: (listingId: string | number) => Promise<void>;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { setTheme } = useTheme();
  const [view, setView] = useState<ViewState>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [preselectedRole, setPreselectedRole] = useState<UserRole>('tenant');
  const [currentListing, setCurrentListing] = useState<Listing | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<(string | number)[]>([]);
  const [activeTab, setActiveTabState] = useState<AppTab>(() => {
    const saved = localStorage.getItem('last_active_tab') as AppTab;
    return (saved && ['home', 'chat', 'profile', 'favorites', 'create', 'mylistings'].includes(saved)) ? saved : 'home';
  });

  const setActiveTab = (tab: AppTab) => {
    setActiveTabState(tab);
    localStorage.setItem('last_active_tab', tab);
  };

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }

    // Subscribe to favorites subcollection
    const favsRef = collection(db, 'users', user.id, 'favorites');
    const unsubscribeFavs = onSnapshot(favsRef, (snapshot) => {
      const favIds = snapshot.docs.map(doc => {
        // If it's a numeric string, convert to number to match mock data IDs
        return /^\d+$/.test(doc.id) ? parseInt(doc.id) : doc.id;
      });
      setFavorites(favIds);
    });

    return () => unsubscribeFavs();
  }, [user]);

  useEffect(() => {
    let unsubscribeUser: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeUser) {
        unsubscribeUser();
        unsubscribeUser = null;
      }

      if (firebaseUser) {
        // Subscribe to real-time updates for the user document
        const userRef = doc(db, "users", firebaseUser.uid);
        unsubscribeUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = { ...docSnap.data(), id: firebaseUser.uid } as User;
            setUser(userData);
            
            // Sync theme from user profile
            if (userData.theme) {
              setTheme(userData.theme);
            }
            
            // Auto redirect logic (only run once on login)
            const justLoggedIn = sessionStorage.getItem("just_logged_in") === "true";
            if (justLoggedIn) {
              sessionStorage.removeItem("just_logged_in");
              if (isProfileComplete(userData)) {
                setActiveTab("home");
              } else {
                setActiveTab("profile");
              }
            }
            
            // Only switch to app view if we are on landing or auth pages
            if (sessionStorage.getItem("sms_reset_flow") !== "active") {
              setView(prev => (prev === "landing" || prev === "auth") ? "app" : prev);
            }
          } else {
            setUser(null);
          }
          setIsLoading(false);
        }, (error) => {
          console.error("User snapshot error:", error);
          setIsLoading(false);
        });
      } else {
        setUser(null);
        setView(prev => prev === "app" ? "landing" : prev);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, []);

  const login = (role: UserRole, userData: Partial<User>) => {
    // Local state will be updated by the onSnapshot listener automatically
    // But we still handle initial redirects here for speed
    if (userData && userData.id) {
       if (isProfileComplete(userData)) {
         setActiveTab('home');
         sessionStorage.removeItem('just_logged_in');
       } else {
         setActiveTab('profile');
       }
       setView('app');
    }
  };

  const updateProfile = async (updates: any) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.id);
      
      // Filter out undefined and null values that shouldn't be updated
      // Firestore doesn't like undefined
      const cleanUpdates: any = {};
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          cleanUpdates[key] = updates[key];
        }
      });

      // Simply update Firestore; local state will sync via onSnapshot
      try {
        await updateDoc(userRef, cleanUpdates);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.id}`);
      }
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

  const toggleFavorite = async (listingId: string | number) => {
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

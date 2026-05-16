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
  toggleFavorite: (listingId: string | number, agentId?: string) => Promise<void>;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { theme, setTheme } = useTheme();
  const [view, setView] = useState<ViewState>(() => {
    if (window.location.pathname === '/admin') return 'admin-auth';
    return 'landing';
  });

  const [user, setUser] = useState<User | null>(null);
  const userRefForEffect = React.useRef<User | null>(null);
  
  useEffect(() => {
    userRefForEffect.current = user;
  }, [user]);

  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  
  // Track if we've synced the theme from the profile to local state for the current session/user
  const themeSyncedFromProfile = React.useRef<string | null>(null);
  const unsubscribeUserRef = React.useRef<(() => void) | null>(null);

  // Track the last theme we successfully received from Firestore to avoid loop
  const lastFirestoreTheme = React.useRef<string | null>(null);

  // Sync theme to firestore when it changes locally
  useEffect(() => {
    // Only sync if we have a user and we've already initialized the local theme from their profile
    // This prevents overwriting the profile with the default 'light' theme on initial load
    if (user && themeSyncedFromProfile.current === user.id) {
      if (user.theme !== theme && theme !== lastFirestoreTheme.current) {
        updateDoc(doc(db, 'users', user.id), { theme }).catch(err => {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.id}`);
        });
      }
    }
  }, [theme, user?.id]);

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
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.id}/favorites`);
    });

    return () => unsubscribeFavs();
  }, [user]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeUserRef.current) {
        unsubscribeUserRef.current();
        unsubscribeUserRef.current = null;
      }

      if (firebaseUser) {
        // Subscribe to real-time updates for the user document
        const userRef = doc(db, "users", firebaseUser.uid);
        unsubscribeUserRef.current = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = { ...docSnap.data(), id: firebaseUser.uid } as User;
            
            // Sync theme from user profile (only once per user session to avoid feedback loops)
            if (userData.theme && themeSyncedFromProfile.current !== firebaseUser.uid && userData.theme !== theme) {
              setTheme(userData.theme);
            }
            themeSyncedFromProfile.current = firebaseUser.uid;
            lastFirestoreTheme.current = userData.theme || null;
            
            // Redirect logic (only run once on login or if role changes)
            const justLoggedIn = sessionStorage.getItem("just_logged_in") === "true";
            
            // Check if redirect is necessary: only on login or role change
            const roleChanged = userRefForEffect.current?.role !== userData.role;
            const needsRedirect = justLoggedIn || roleChanged;
            
            // If the user doc was just created locally, wait briefly until it syncs to server 
            const isLocalOnly = docSnap.metadata.hasPendingWrites && !docSnap.metadata.fromCache;
            if (isLocalOnly && (userData.role === 'admin' || userData.role === 'moderator') && !justLoggedIn) {
              console.log("Admin profile has pending writes. Waiting for server sync...");
              setIsLoading(false);
              return; 
            }

            if (justLoggedIn) {
              sessionStorage.removeItem("just_logged_in");
              if (userData.role === 'admin' || userData.role === 'moderator') {
                setView('admin');
              } else {
                const isVerified = userData.verificationStatus === 'verified' || userData.verificationLevel === 'verified';
                if (isVerified || isProfileComplete(userData)) {
                  setActiveTab("home");
                } else {
                  setActiveTab("profile");
                }
                setView('app');
              }
            } else if (roleChanged) {
              // Only switch to app view if we are on landing or auth pages
              if (sessionStorage.getItem("sms_reset_flow") !== "active") {
                if (userData.role === 'admin' || userData.role === 'moderator') {
                  if (view === "landing" || view === "auth" || view === "admin-auth") {
                    setView("admin");
                  }
                } else {
                  if (view === "landing" || view === "auth") {
                    setView("app");
                  }
                }
              }
            }
            setUser(userData);
          } else {
            // Self-healing: If user is authenticated but missing a profile document
            // This happens if Firestore write failed during signup
            const adminEmails = ['adeyemiakinyemi01@gmail.com'];
            const isHardcodedAdmin = firebaseUser.email && adminEmails.includes(firebaseUser.email.toLowerCase());
            
            if (isHardcodedAdmin) {
              console.log("Self-healing: Creating missing admin profile for", firebaseUser.email);
              const newAdmin: any = {
                id: firebaseUser.uid,
                firstName: 'Admin',
                lastName: 'User',
                name: 'Admin User',
                email: firebaseUser.email || '',
                role: 'admin',
                city: 'Lagos',
                country: 'Nigeria',
                nin: '00000000000',
                verificationStatus: 'verified',
                verificationLevel: 'verified',
                adminTier: 'Moderator',
                createdAt: serverTimestamp()
              };
              
              setDoc(userRef, newAdmin).catch(err => {
                console.error("Self-healing failed:", err);
              });
              // The update will trigger onSnapshot again and we'll enter the exists() block
            } else {
              setUser(null);
            }
          }
          setIsLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          setIsLoading(false);
        });
      } else {
        setUser(null);
        setView(prev => (prev === "app" || prev === "admin") ? "landing" : prev);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserRef.current) unsubscribeUserRef.current();
    };
  }, []);

  const login = (role: UserRole, userData: Partial<User>) => {
    // Local state will be updated by the onSnapshot listener automatically
    // But we still handle initial redirects here for speed
    if (userData && userData.id) {
       if (userData.role === 'admin' || userData.role === 'moderator') {
         setView('admin');
       } else {
         const isVerified = userData.verificationStatus === 'verified' || userData.verificationLevel === 'verified';
         if (isVerified || isProfileComplete(userData as User)) {
           setActiveTab('home');
           sessionStorage.removeItem('just_logged_in');
         } else {
           setActiveTab('profile');
         }
         setView('app');
       }
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
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear data listeners first
      if (unsubscribeUserRef.current) {
        unsubscribeUserRef.current();
        unsubscribeUserRef.current = null;
      }
      
      await signOut(auth);
      
      // Reset all states locally immediately to prevent race conditions during unmount
      setUser(null);
      setFavorites([]);
      themeSyncedFromProfile.current = null;
      setView('landing');
      setActiveTab('home');
      setCurrentListing(null);
      setSelectedAgentId(null);
      
      // Scroll to the top of the page
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleFavorite = async (listingId: string | number, agentId?: string) => {
    if (!user) {
      setAuthMode('login');
      setView('auth');
      return;
    }

    const listingIdStr = listingId.toString();
    const favDocRef = doc(db, 'users', user.id, 'favorites', listingIdStr);
    const listingRef = doc(db, 'listings', listingIdStr);
    const { increment, setDoc: fsSetDoc, addDoc } = await import('firebase/firestore');
    
    // Check using string comparison to avoid type issues
    const isAlreadyFavorited = favorites.some(id => id.toString() === listingIdStr);

    try {
      if (isAlreadyFavorited) {
        await deleteDoc(favDocRef);
        // Decrease favorite count on the listing
        await updateDoc(listingRef, {
          favoritesCount: increment(-1),
          updatedAt: serverTimestamp()
        }).catch(() => {/* Ignore if listing doesn't exist in DB */});
      } else {
        await setDoc(favDocRef, {
          listingId: listingIdStr,
          createdAt: serverTimestamp()
        });
        
        // Record analytics for the save
        if (agentId) {
          await addDoc(collection(db, 'analytics'), {
            listingId: listingIdStr,
            type: 'save',
            userId: user.id,
            agentId: agentId,
            createdAt: serverTimestamp()
          }).catch(err => console.warn("Failed to record save analytics:", err));
        }

        // Increase favorite count on the listing
        await fsSetDoc(listingRef, {
          favoritesCount: increment(1),
          updatedAt: serverTimestamp()
        }, { merge: true }).catch(err => console.warn("Failed to sync favoritesCount:", err));
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

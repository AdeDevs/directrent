import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User, UserRole, ViewState, AuthMode, Listing, AppTab } from '../types';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, linkWithCredential, EmailAuthProvider, updatePassword as fbUpdatePassword } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, deleteDoc, serverTimestamp, deleteField, updateDoc, FieldValue } from 'firebase/firestore';
import { isProfileComplete, calculateVerificationLevel } from '../lib/verification';
import { useTheme } from './ThemeContext';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (role: UserRole, userData: Partial<User>) => void;
  logout: () => Promise<void>;
  updateProfile: (updates: any) => Promise<void>;
  signInWithGoogle: (preferredRole?: UserRole) => Promise<boolean>;
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
  isSigningUp: boolean;
  setIsSigningUp: (val: boolean) => void;
  publishingProgress: number | null;
  setPublishingProgress: React.Dispatch<React.SetStateAction<number | null>>;
  publishingStatus: string;
  setPublishingStatus: (status: string) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { theme, setTheme } = useTheme();
  const [view, setView] = useState<ViewState>(() => {
    const p = window.location.pathname;
    if (p === '/admin' || p.startsWith('/admin/')) return 'admin-auth';
    if (p === '/login' || p === '/auth') return 'auth';
    if (p === '/terms') return 'legal';
    return 'landing';
  });

  const [user, setUser] = useState<User | null>(null);
  const userRefForEffect = React.useRef<User | null>(null);
  
  useEffect(() => {
    userRefForEffect.current = user;
  }, [user]);

  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isSigningUp, setIsSigningUp] = useState(false);
  
  // Track if we've synced the theme from the profile to local state for the current session/user
  const themeSyncedFromProfile = React.useRef<string | null>(null);
  const unsubscribeUserRef = React.useRef<(() => void) | null>(null);

  // Track the last theme we successfully received from Firestore to avoid loop
  const lastFirestoreTheme = React.useRef<string | null>(null);

  const [preselectedRole, setPreselectedRole] = useState<UserRole>('tenant');
  const [currentListing, setCurrentListingState] = useState<Listing | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<(string | number)[]>([]);
  const tabList: AppTab[] = ['home', 'chat', 'profile', 'favorites', 'create', 'mylistings', 'notifications', 'terms', 'faq'];
  
  const [activeTab, setActiveTabState] = useState<AppTab>(() => {
    const pathname = window.location.pathname;
    let cleanPath = pathname.replace(/^\//, '');
    
    // Handle admin sub-paths
    if (cleanPath.startsWith('admin/')) {
        cleanPath = cleanPath.split('/')[1];
    }
    
    if (tabList.includes(cleanPath as AppTab)) {
      return cleanPath as AppTab;
    }
    const saved = localStorage.getItem('last_active_tab') as AppTab;
    return (saved && tabList.includes(saved)) ? saved : 'home';
  });

  const setCurrentListing = (listing: Listing | null) => {
    if (listing === null) {
      const targetPath = `/${activeTab}`;
      const newState = {
        view,
        activeTab,
        currentListing: null,
        selectedAgentId
      };
      window.history.replaceState(newState, "", targetPath);
    }
    setCurrentListingState(listing);
  };

  const setActiveTab = (tab: AppTab) => {
    const targetPath = `/${tab}`;
    const newState = {
      view,
      activeTab: tab,
      currentListing: null,
      selectedAgentId: null
    };
    window.history.pushState(newState, "", targetPath);

    setActiveTabState(tab);
    localStorage.setItem('last_active_tab', tab);
  };

  // Global listing publish progress states (for top dashboard progress-bar rendering)
  const [publishingProgress, setPublishingProgress] = useState<number | null>(null);
  const [publishingStatus, setPublishingStatus] = useState<string>('');

  const [isSidebarCollapsed, setIsSidebarCollapsedState] = useState<boolean>(() => {
    return localStorage.getItem("directrent_sidebar_collapsed") === "true";
  });

  const setIsSidebarCollapsed = (collapsed: boolean) => {
    setIsSidebarCollapsedState(collapsed);
    localStorage.setItem("directrent_sidebar_collapsed", String(collapsed));
  };

  // Synchronize browser back button history with SPA navigation state
  const isPopStateRef = useRef(false);

  // Initialize the first state on mount so we can replaceState
  useEffect(() => {
    // Sync initial states from deep link if applicable
    const pathname = window.location.pathname;
    if (pathname && pathname !== '/' && pathname !== '/home') {
      const parts = pathname.split('/');
      const firstPart = parts[1];
      const secondPart = parts[2];
      
      const tabList: AppTab[] = ['home', 'chat', 'profile', 'favorites', 'create', 'mylistings', 'notifications', 'terms', 'faq'];
      if (tabList.includes(firstPart as AppTab)) {
        setActiveTabState(firstPart as AppTab);
      } else if (firstPart === 'agent' && secondPart) {
        setSelectedAgentId(secondPart);
        setActiveTabState('home');
      }
    }

    const initialState = {
      view,
      activeTab: activeTab,
      currentListing: currentListing,
      selectedAgentId: selectedAgentId
    };
    
    let initialPath = '/';
    if (view === 'admin') {
      initialPath = activeTab === 'home' ? '/admin/home' : `/admin/${activeTab}`;
    } else if (view === 'admin-auth') {
      initialPath = '/admin';
    } else if (view === 'landing') {
      initialPath = '/';
    } else if (view === 'auth') {
      initialPath = '/login';
    } else if (view === 'legal') {
      initialPath = '/terms';
    } else {
      initialPath = selectedAgentId 
        ? `/agent/${selectedAgentId}` 
        : (currentListing 
          ? `/property/${currentListing.id}` 
          : `/${activeTab}`
        );
    }

    if (window.location.pathname !== initialPath && window.location.pathname !== '/') {
        // preserve external deep links if any
        initialPath = window.location.pathname;
    }

    window.history.replaceState(initialState, "", initialPath);

    const handlePopState = (event: PopStateEvent) => {
      isPopStateRef.current = true;
      if (event.state) {
        // Apply historical states back into React
        if (event.state.view !== undefined) {
          setView(event.state.view);
        }
        if (event.state.activeTab !== undefined) {
          setActiveTabState(event.state.activeTab);
          localStorage.setItem('last_active_tab', event.state.activeTab);
        }
        setCurrentListing(event.state.currentListing || null);
        setSelectedAgentId(event.state.selectedAgentId || null);
      } else {
        // Fallback: Parse URL pathname on browser gesture back/forward transitions if State is null
        const p = window.location.pathname;
        if (p === '/admin' || p.startsWith('/admin/')) {
          setView('admin-auth');
        } else if (p === '/login' || p === '/auth') {
          setView('auth');
        } else if (p === '/terms' || p === '/legal') {
          setView('legal');
        } else if (p === '/' || p === '/home') {
          setView('landing');
          setActiveTabState('home');
          setCurrentListing(null);
          setSelectedAgentId(null);
        } else {
          let cleanPath = p.replace(/^\//, '');
          const tabList: AppTab[] = ['home', 'chat', 'profile', 'favorites', 'create', 'mylistings', 'notifications', 'terms', 'faq'];
          if (tabList.includes(cleanPath as AppTab)) {
            setView('app');
            setActiveTabState(cleanPath as AppTab);
          }
        }
      }
      // Reset popstate flag shortly after React render
      setTimeout(() => {
        isPopStateRef.current = false;
      }, 50);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Whenever React states change from in-app navigation, push a new history entry
  useEffect(() => {
    // Skip pushing state if we got here via browser back/forward buttons
    if (isPopStateRef.current) return;

    // Build current state representation
    const newState = {
      view,
      activeTab,
      currentListing,
      selectedAgentId
    };

    let targetPath = '/';
    if (view === 'admin') {
      targetPath = activeTab === 'home' ? '/admin/home' : `/admin/${activeTab}`;
    } else if (view === 'admin-auth') {
      targetPath = '/admin';
    } else if (view === 'landing') {
      targetPath = '/';
    } else if (view === 'auth') {
      targetPath = '/login';
    } else if (view === 'legal') {
      targetPath = '/terms';
    } else {
      targetPath = selectedAgentId 
        ? `/agent/${selectedAgentId}` 
        : (currentListing 
          ? `/property/${currentListing.id}` 
          : `/${activeTab}`
        );
    }

    // Only push if the state is actually different from the stored history state to prevent redundant entries
    const historyState = window.history.state;
    const isDifferent = !historyState ||
      historyState.activeTab !== activeTab ||
      historyState.view !== view ||
      JSON.stringify(historyState.currentListing) !== JSON.stringify(currentListing) ||
      historyState.selectedAgentId !== selectedAgentId ||
      window.location.pathname !== targetPath;

    if (isDifferent) {
      window.history.pushState(newState, "", targetPath);
    }
  }, [view, activeTab, currentListing, selectedAgentId]);

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
    }, (error: any) => {
      if (error?.code === 'permission-denied' || error?.message?.includes('permission')) return;
      console.error("Favorites subcollection subscription error:", error);
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
            
            // Ensure hasPassword flag is populated
            if (userData.hasPassword === undefined) {
              userData.hasPassword = firebaseUser.providerData.some(p => p.providerId === 'password');
            }
            
            // Sync theme from user profile (only once per user session to avoid feedback loops)
            if (themeSyncedFromProfile.current !== firebaseUser.uid) {
              if (userData.theme) {
                if (userData.theme !== theme) {
                  setTheme(userData.theme);
                }
              } else {
                // Initialize theme in database for users who don't have it set yet
                updateDoc(doc(db, 'users', firebaseUser.uid), { theme }).catch(() => {});
              }
            }
            themeSyncedFromProfile.current = firebaseUser.uid;
            lastFirestoreTheme.current = userData.theme || null;
            
            // Redirect logic (only run once on login or if role changes)
            const justLoggedIn = sessionStorage.getItem("just_logged_in") === "true";
            
            const targetRedirect = sessionStorage.getItem('redirect_after_auth');
            if (targetRedirect && firebaseUser) {
              sessionStorage.removeItem('redirect_after_auth');
              sessionStorage.removeItem('just_logged_in');
              setUser(userData);
              setView('app');
              setIsLoading(false);
              window.location.href = targetRedirect;
              return;
            }
            
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
            console.log("User profile document does not exist.");
          }
          setIsLoading(false);
        }, (error: any) => {
          if (error?.code === 'permission-denied' || error?.message?.includes('permission')) return;
          console.error("User profile document subscription error:", error);
          setIsLoading(false);
        });
      } else {
        setUser(null);
        setView(prev => (prev === "app" || prev === "admin") ? "landing" : prev);
        
        // If logged out and on a protected path (non-listing, non-terms), redirect to root
        const p = window.location.pathname;
        const isListPath = p.startsWith('/listings/') || p.startsWith('/property/');
        if (!isListPath && p !== '/' && p !== '/admin' && p !== '/admin-auth' && p !== '/terms') {
          window.history.replaceState(null, "", "/");
        }
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserRef.current) unsubscribeUserRef.current();
    };
  }, []);

  // Automatically reconcile temporary agent IDs for Leon Atlas and Peace Olaoluwa
  useEffect(() => {
    if (user?.role === 'agent' && (user.email === 'leonofatlas@gmail.com' || user.email === 'peaceolaoluwa2006@gmail.com')) {
      const email = user.email;
      const targetAgentId = email === 'leonofatlas@gmail.com' ? 'agent_leon' : 'agent_peace';
      
      const reconcileAgentListings = async () => {
        try {
          const { collection, getDocs, query, where, updateDoc, doc } = await import('firebase/firestore');
          
          // 1. Reconcile Listings
          const qListings = query(collection(db, 'listings'), where('agent.id', '==', targetAgentId));
          const snapListings = await getDocs(qListings);
          
          if (!snapListings.empty) {
            console.log(`Reconciling ${snapListings.size} listings for agent ${email}...`);
            const promises = snapListings.docs.map(listingDoc => {
              const currentAgent = listingDoc.data().agent || {};
              return updateDoc(doc(db, 'listings', listingDoc.id), {
                'agent.id': user.id,
                'agent.name': user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || currentAgent.name,
                'agent.avatarUrl': user.avatarUrl || currentAgent.avatarUrl || null,
                'agent.isVerified': true
              });
            });
            await Promise.all(promises);
          }

          // 2. Reconcile Conversations
          const qConvs = query(collection(db, 'conversations'), where('agentId', '==', targetAgentId));
          const snapConvs = await getDocs(qConvs);
          
          if (!snapConvs.empty) {
            console.log(`Reconciling ${snapConvs.size} conversations for agent ${email}...`);
            const pConvs = snapConvs.docs.map(convDoc => {
              return updateDoc(doc(db, 'conversations', convDoc.id), {
                agentId: user.id,
                agentName: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()
              });
            });
            await Promise.all(pConvs);
          }
        } catch (error) {
          console.error("Reconciliation error:", error);
        }
      };
      reconcileAgentListings();
    }
  }, [user]);

  const login = (role: UserRole, userData: Partial<User>) => {
    // Local state will be updated by the onSnapshot listener automatically
    // But we still handle initial redirects here for speed
    const targetRedirect = sessionStorage.getItem('redirect_after_auth');
    if (targetRedirect) {
      sessionStorage.removeItem('redirect_after_auth');
      sessionStorage.removeItem('just_logged_in');
      setView('app');
      window.location.href = targetRedirect;
      return;
    }
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
      const cleanUpdates: any = {};
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          cleanUpdates[key] = updates[key];
        }
      });

      // Security measure: if user already has a NIN, ignore any updates trying to modify or delete it
      if (user.nin && cleanUpdates.nin !== undefined && cleanUpdates.nin !== user.nin) {
        delete cleanUpdates.nin;
      }

      // Special handling for trust level recalculation if core fields change
      if (cleanUpdates.phoneNumber || cleanUpdates.nin || cleanUpdates.avatarUrl) {
         cleanUpdates.verificationLevel = calculateVerificationLevel({ ...user, ...cleanUpdates });
      }

      await updateDoc(userRef, cleanUpdates);
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  const signInWithGoogle = async (preferredRole?: UserRole): Promise<boolean> => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Check if user exists in Firestore
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Create new profile from Google data
        const names = firebaseUser.displayName?.split(' ') || [];
        const firstName = names[0] || '';
        const lastName = names.slice(1).join(' ') || '';

        const newProfile: any = {
          id: firebaseUser.uid,
          firstName,
          lastName,
          name: firebaseUser.displayName || '',
          email: firebaseUser.email || '',
          avatarUrl: firebaseUser.photoURL || '',
          role: preferredRole || preselectedRole || 'tenant',
          city: '',
          country: 'Nigeria',
          phoneNumber: firebaseUser.phoneNumber || '',
          phoneVerified: !!firebaseUser.phoneNumber,
          verificationStatus: 'none',
          verificationLevel: 'none',
          listingsCount: 0,
          createdAt: serverTimestamp(),
          authProvider: 'google',
          theme: theme
        };

        // Recalculate verification level
        newProfile.verificationLevel = calculateVerificationLevel(newProfile);

        await setDoc(userRef, newProfile);
      } else {
        // Just sync avatar if it's missing
        const existingData = userSnap.data();
        if (!existingData.avatarUrl && firebaseUser.photoURL) {
          await updateDoc(userRef, { avatarUrl: firebaseUser.photoURL });
        }
      }

      sessionStorage.setItem('just_logged_in', 'true');
      return true;
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      throw error;
    } finally {
      setIsLoading(false);
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
      
      // Reset local theme to light on logout so it doesn't leak or bleed to other accounts
      setTheme('light');

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
      signInWithGoogle,
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
      isSigningUp,
      setIsSigningUp,
      publishingProgress,
      setPublishingProgress,
      publishingStatus,
      setPublishingStatus,
      isSidebarCollapsed,
      setIsSidebarCollapsed,
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

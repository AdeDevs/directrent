import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, ViewState, AuthMode, Listing } from '../types';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser(userData);
            // Only switch to app view if we are on landing or auth pages
            setView(prev => (prev === 'landing' || prev === 'auth') ? 'app' : prev);
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
       setView('app');
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    try {
      const updatedUser = { ...user, ...updates };
      await setDoc(doc(db, 'users', user.id), updatedUser, { merge: true });
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
      setView('landing');
    } catch (error) {
      console.error("Error signing out:", error);
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

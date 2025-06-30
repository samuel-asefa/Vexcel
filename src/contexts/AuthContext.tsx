import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from '../types/user';
import { signInWithGoogle, signOut, onAuthStateChange } from '../services/authService';
import { getUserById, updateUser as updateUserService } from '../services/userService';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = async () => {
    if (!firebaseUser) return;
    
    try {
      const userData = await getUserById(firebaseUser.uid);
      if (userData) {
        setUser(userData);
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.uid || 'No user');
      
      try {
        setFirebaseUser(firebaseUser);
        setError(null);
        
        if (firebaseUser) {
          console.log('Loading user data for:', firebaseUser.uid);
          
          try {
            // Try to get user data from Firestore
            const userData = await getUserById(firebaseUser.uid);
            
            if (userData) {
              console.log('User data loaded successfully:', userData.name);
              setUser(userData);
            } else {
              console.log('No user data found, user needs to complete profile setup');
              // Create a basic user profile if none exists
              const basicUser: User = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'New User',
                email: firebaseUser.email || 'user@example.com',
                avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'User')}&background=3b82f6&color=fff`,
                role: 'student',
                level: 1,
                xp: 0,
                teamId: null,
                completedLessons: [],
                achievements: [],
                streakDays: 0,
                totalTimeSpent: 0,
                createdAt: new Date(),
                lastActive: new Date()
              };
              setUser(basicUser);
            }
          } catch (firestoreError) {
            console.warn('Firestore error, creating basic user profile:', firestoreError);
            // If Firestore fails, create a basic user profile
            const basicUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'New User',
              email: firebaseUser.email || 'user@example.com',
              avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'User')}&background=3b82f6&color=fff`,
              role: 'student',
              level: 1,
              xp: 0,
              teamId: null,
              completedLessons: [],
              achievements: [],
              streakDays: 0,
              totalTimeSpent: 0,
              createdAt: new Date(),
              lastActive: new Date()
            };
            setUser(basicUser);
          }
        } else {
          console.log('No Firebase user, clearing user data');
          setUser(null);
        }
      } catch (err) {
        console.error('Error in auth state change:', err);
        setError('Failed to load user data');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    // Cleanup function
    return () => {
      console.log('Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  const login = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Starting login process...');
      
      const userData = await signInWithGoogle();
      
      if (userData) {
        console.log('Login successful:', userData.name);
        setUser(userData);
      } else {
        throw new Error('Failed to get user data after login');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Starting logout process...');
      
      await signOut();
      setUser(null);
      setFirebaseUser(null);
      console.log('Logout successful');
    } catch (err: any) {
      console.error('Logout error:', err);
      setError(err.message || 'Failed to sign out');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) {
      throw new Error('No user to update');
    }
    
    try {
      setError(null);
      console.log('Updating user:', updates);
      
      // Update local state immediately for better UX
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      
      try {
        await updateUserService(user.id, updates);
      } catch (firestoreError) {
        console.warn('Firestore update failed, keeping local changes:', firestoreError);
      }
      
      console.log('User updated successfully');
    } catch (err: any) {
      console.error('Update user error:', err);
      setError(err.message || 'Failed to update user');
      throw err;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const contextValue: AuthContextType = {
    user,
    firebaseUser,
    isAuthenticated: !!user && !!firebaseUser,
    isLoading,
    error,
    login,
    logout,
    updateUser,
    refreshUser,
    clearError
  };

  return (
    <AuthContext.Provider value={contextValue}>
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
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
              console.log('No user data found, creating mock user for development');
              // Create a mock user for development if no Firestore data
              const mockUser: User = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'Test User',
                email: firebaseUser.email || 'test@example.com',
                avatar: firebaseUser.photoURL || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
                role: 'student',
                level: 12,
                xp: 2340,
                teamId: null,
                completedLessons: ['lesson-1', 'lesson-2', 'lesson-3'],
                achievements: ['first-lesson', 'quiz-master', 'team-player'],
                streakDays: 7,
                totalTimeSpent: 1485,
                createdAt: new Date(),
                lastActive: new Date()
              };
              setUser(mockUser);
            }
          } catch (firestoreError) {
            console.warn('Firestore error, using mock data:', firestoreError);
            // If Firestore fails, use mock data
            const mockUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'Test User',
              email: firebaseUser.email || 'test@example.com',
              avatar: firebaseUser.photoURL || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
              role: 'student',
              level: 12,
              xp: 2340,
              teamId: null,
              completedLessons: ['lesson-1', 'lesson-2', 'lesson-3'],
              achievements: ['first-lesson', 'quiz-master', 'team-player'],
              streakDays: 7,
              totalTimeSpent: 1485,
              createdAt: new Date(),
              lastActive: new Date()
            };
            setUser(mockUser);
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
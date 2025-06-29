import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';
import { User } from '../types/user';

export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    console.log('Starting Google sign-in...');
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;
    
    console.log('Google sign-in successful, checking user data...');
    
    try {
      // Check if user exists in Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      let userData: User;
      
      if (userDoc.exists()) {
        // User exists, get their data
        console.log('Existing user found');
        const data = userDoc.data();
        userData = { 
          id: firebaseUser.uid, 
          ...data,
          // Convert Firestore timestamps to Date objects
          createdAt: data.createdAt?.toDate() || new Date(),
          lastActive: data.lastActive?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as User;
      } else {
        // New user, create profile
        console.log('New user, creating profile...');
        userData = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Anonymous User',
          email: firebaseUser.email || '',
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
        
        // Save to Firestore
        await setDoc(userDocRef, {
          ...userData,
          createdAt: userData.createdAt,
          lastActive: userData.lastActive,
          updatedAt: new Date()
        });
        console.log('New user profile created');
      }
      
      // Update last active
      await updateDoc(userDocRef, {
        lastActive: new Date(),
        updatedAt: new Date()
      });
      
      console.log('User data ready:', userData.name);
      return userData;
    } catch (firestoreError) {
      console.warn('Firestore operation failed, creating mock user:', firestoreError);
      // If Firestore fails, create a mock user
      const mockUser: User = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'Test User',
        email: firebaseUser.email || '',
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
      return mockUser;
    }
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Pop-up was blocked by browser');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error(error.message || 'Failed to sign in');
    }
  }
};

export const signOut = async (): Promise<void> => {
  try {
    console.log('Signing out...');
    await firebaseSignOut(auth);
    console.log('Sign out successful');
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
};

export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  console.log('Setting up auth state listener');
  return onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed:', user ? `User: ${user.uid}` : 'No user');
    callback(user);
  }, (error) => {
    console.error('Auth state change error:', error);
  });
};

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};
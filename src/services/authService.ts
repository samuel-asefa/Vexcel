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
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;
    
    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    let userData: User;
    
    if (userDoc.exists()) {
      // User exists, get their data
      userData = { id: firebaseUser.uid, ...userDoc.data() } as User;
    } else {
      // New user, create profile
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
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
    }
    
    // Update last active
    await updateDoc(doc(db, 'users', firebaseUser.uid), {
      lastActive: new Date()
    });
    
    return userData;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};
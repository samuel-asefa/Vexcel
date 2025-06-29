import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../types/user';

export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { id: userId, ...userDoc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const updateUserProgress = async (
  userId: string, 
  lessonId: string, 
  xpGained: number,
  timeSpent: number
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      const newXP = userData.xp + xpGained;
      const newLevel = Math.floor(newXP / 200) + 1;
      const completedLessons = [...userData.completedLessons];
      
      if (!completedLessons.includes(lessonId)) {
        completedLessons.push(lessonId);
      }
      
      await updateDoc(userRef, {
        xp: newXP,
        level: newLevel,
        completedLessons,
        totalTimeSpent: userData.totalTimeSpent + timeSpent,
        lastActive: new Date()
      });
    }
  } catch (error) {
    console.error('Error updating user progress:', error);
    throw error;
  }
};

export const getUsersByTeam = async (teamId: string): Promise<User[]> => {
  try {
    const q = query(
      collection(db, 'users'),
      where('teamId', '==', teamId)
    );
    
    const querySnapshot = await getDocs(q);
    const users: User[] = [];
    
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() } as User);
    });
    
    return users;
  } catch (error) {
    console.error('Error getting team users:', error);
    throw error;
  }
};

export const getTopUsers = async (limitCount: number = 10): Promise<User[]> => {
  try {
    const q = query(
      collection(db, 'users'),
      orderBy('xp', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const users: User[] = [];
    
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() } as User);
    });
    
    return users;
  } catch (error) {
    console.error('Error getting top users:', error);
    throw error;
  }
};
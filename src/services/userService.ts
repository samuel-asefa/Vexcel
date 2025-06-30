import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../types/user';

export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    console.log('Fetching user data for:', userId);
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log('User data found');
      return { 
        id: userId, 
        ...data,
        // Convert Firestore timestamps to Date objects
        createdAt: data.createdAt?.toDate() || new Date(),
        lastActive: data.lastActive?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        // Ensure arrays exist
        completedLessons: data.completedLessons || [],
        achievements: data.achievements || []
      } as User;
    } else {
      console.log('No user document found');
      return null;
    }
  } catch (error) {
    console.error('Error getting user:', error);
    // Return null instead of throwing to prevent crashes
    return null;
  }
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
  try {
    console.log('Updating user:', userId, updates);
    
    // Remove any Date objects and convert them to Firestore timestamps
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });
    
    await updateDoc(doc(db, 'users', userId), updateData);
    console.log('User updated successfully');
  } catch (error) {
    console.error('Error updating user:', error);
    // Don't throw error to prevent crashes
  }
};

export const updateUserProgress = async (
  userId: string, 
  lessonId: string, 
  xpGained: number,
  timeSpent: number
): Promise<void> => {
  try {
    console.log('Updating user progress:', { userId, lessonId, xpGained, timeSpent });
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      const currentXP = userData.xp || 0;
      const currentCompletedLessons = userData.completedLessons || [];
      const currentTimeSpent = userData.totalTimeSpent || 0;
      
      const newXP = currentXP + xpGained;
      const newLevel = Math.floor(newXP / 200) + 1;
      const completedLessons = [...currentCompletedLessons];
      
      if (!completedLessons.includes(lessonId)) {
        completedLessons.push(lessonId);
      }
      
      await updateDoc(userRef, {
        xp: newXP,
        level: newLevel,
        completedLessons,
        totalTimeSpent: currentTimeSpent + timeSpent,
        lastActive: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('User progress updated successfully');
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error updating user progress:', error);
    // Don't throw error to prevent crashes
  }
};

export const getUsersByTeam = async (teamId: string): Promise<User[]> => {
  try {
    console.log('Fetching team users for:', teamId);
    
    const q = query(
      collection(db, 'users'),
      where('teamId', '==', teamId)
    );
    
    const querySnapshot = await getDocs(q);
    const users: User[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({ 
        id: doc.id, 
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastActive: data.lastActive?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        // Ensure arrays exist
        completedLessons: data.completedLessons || [],
        achievements: data.achievements || []
      } as User);
    });
    
    console.log(`Found ${users.length} team members`);
    return users;
  } catch (error) {
    console.error('Error getting team users:', error);
    return [];
  }
};

export const getTopUsers = async (limitCount: number = 10): Promise<User[]> => {
  try {
    console.log('Fetching top users, limit:', limitCount);
    
    const q = query(
      collection(db, 'users'),
      orderBy('xp', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const users: User[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({ 
        id: doc.id, 
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastActive: data.lastActive?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        // Ensure arrays exist
        completedLessons: data.completedLessons || [],
        achievements: data.achievements || []
      } as User);
    });
    
    console.log(`Found ${users.length} top users`);
    return users;
  } catch (error) {
    console.error('Error getting top users:', error);
    return [];
  }
};

// Automatically promote first team member to captain
export const promoteToTeamCaptain = async (userId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      role: 'captain',
      updatedAt: serverTimestamp()
    });
    console.log('User promoted to team captain:', userId);
  } catch (error) {
    console.error('Error promoting user to captain:', error);
    throw new Error('Failed to promote user to captain');
  }
};
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
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as User;
    } else {
      console.log('No user document found');
      return null;
    }
  } catch (error) {
    console.error('Error getting user:', error);
    throw new Error('Failed to load user data');
  }
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
  try {
    console.log('Updating user:', userId, updates);
    
    // Remove any Date objects and convert them to Firestore timestamps
    const updateData = {
      ...updates,
      updatedAt: new Date()
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
    throw new Error('Failed to update user');
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
        lastActive: new Date(),
        updatedAt: new Date()
      });
      
      console.log('User progress updated successfully');
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error updating user progress:', error);
    throw new Error('Failed to update progress');
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
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as User);
    });
    
    console.log(`Found ${users.length} team members`);
    return users;
  } catch (error) {
    console.error('Error getting team users:', error);
    throw new Error('Failed to load team members');
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
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as User);
    });
    
    console.log(`Found ${users.length} top users`);
    return users;
  } catch (error) {
    console.error('Error getting top users:', error);
    throw new Error('Failed to load leaderboard');
  }
};
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  arrayUnion,
  arrayRemove,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Team, AssignedLesson } from '../types/team';

export const createTeam = async (teamData: Omit<Team, 'id'>): Promise<string> => {
  try {
    const teamRef = doc(collection(db, 'teams'));
    await setDoc(teamRef, {
      ...teamData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return teamRef.id;
  } catch (error) {
    console.error('Error creating team:', error);
    throw error;
  }
};

export const getTeamById = async (teamId: string): Promise<Team | null> => {
  try {
    const teamDoc = await getDoc(doc(db, 'teams', teamId));
    if (teamDoc.exists()) {
      return { id: teamId, ...teamDoc.data() } as Team;
    }
    return null;
  } catch (error) {
    console.error('Error getting team:', error);
    throw error;
  }
};

export const getTeamByCode = async (code: string): Promise<Team | null> => {
  try {
    const q = query(
      collection(db, 'teams'),
      where('code', '==', code),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Team;
    }
    return null;
  } catch (error) {
    console.error('Error getting team by code:', error);
    throw error;
  }
};

export const joinTeam = async (teamId: string, userId: string): Promise<void> => {
  try {
    // Add user to team members
    await updateDoc(doc(db, 'teams', teamId), {
      memberIds: arrayUnion(userId),
      updatedAt: new Date()
    });
    
    // Update user's teamId
    await updateDoc(doc(db, 'users', userId), {
      teamId: teamId,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error joining team:', error);
    throw error;
  }
};

export const leaveTeam = async (teamId: string, userId: string): Promise<void> => {
  try {
    // Remove user from team members
    await updateDoc(doc(db, 'teams', teamId), {
      memberIds: arrayRemove(userId),
      updatedAt: new Date()
    });
    
    // Remove teamId from user
    await updateDoc(doc(db, 'users', userId), {
      teamId: null,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error leaving team:', error);
    throw error;
  }
};

export const assignLessonToTeam = async (
  teamId: string,
  lessonId: string,
  assignedBy: string,
  assignedTo: string[],
  dueDate: Date
): Promise<void> => {
  try {
    const assignment: AssignedLesson = {
      id: `${teamId}_${lessonId}_${Date.now()}`,
      lessonId,
      assignedTo,
      assignedBy,
      dueDate,
      assignedAt: new Date(),
      completed: []
    };
    
    await updateDoc(doc(db, 'teams', teamId), {
      assignedLessons: arrayUnion(assignment),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error assigning lesson:', error);
    throw error;
  }
};

export const getTeamLeaderboard = async (limitCount: number = 10): Promise<Team[]> => {
  try {
    const q = query(
      collection(db, 'teams'),
      orderBy('stats.totalXP', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const teams: Team[] = [];
    
    querySnapshot.forEach((doc) => {
      teams.push({ id: doc.id, ...doc.data() } as Team);
    });
    
    return teams;
  } catch (error) {
    console.error('Error getting team leaderboard:', error);
    throw error;
  }
};

export const getAvailableTeams = async (): Promise<Team[]> => {
  try {
    const q = query(
      collection(db, 'teams'),
      where('isPrivate', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const teams: Team[] = [];
    
    querySnapshot.forEach((doc) => {
      teams.push({ id: doc.id, ...doc.data() } as Team);
    });
    
    return teams;
  } catch (error) {
    console.error('Error getting available teams:', error);
    throw error;
  }
};
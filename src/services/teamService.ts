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
    throw new Error('Failed to create team');
  }
};

export const getTeamById = async (teamId: string): Promise<Team | null> => {
  try {
    const teamDoc = await getDoc(doc(db, 'teams', teamId));
    if (teamDoc.exists()) {
      const data = teamDoc.data();
      return { 
        id: teamId, 
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        // Ensure arrays exist
        memberIds: data.memberIds || [],
        assignedLessons: data.assignedLessons || []
      } as Team;
    }
    return null;
  } catch (error) {
    console.error('Error getting team:', error);
    return null;
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
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        // Ensure arrays exist
        memberIds: data.memberIds || [],
        assignedLessons: data.assignedLessons || []
      } as Team;
    }
    return null;
  } catch (error) {
    console.error('Error getting team by code:', error);
    return null;
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
    throw new Error('Failed to join team');
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
    throw new Error('Failed to leave team');
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
    throw new Error('Failed to assign lesson');
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
      const data = doc.data();
      teams.push({ 
        id: doc.id, 
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        // Ensure arrays exist
        memberIds: data.memberIds || [],
        assignedLessons: data.assignedLessons || []
      } as Team);
    });
    
    return teams;
  } catch (error) {
    console.error('Error getting team leaderboard:', error);
    // Return mock data if Firebase fails
    return [
      {
        id: 'mock-team-1',
        name: '750W',
        code: 'VRC750W',
        captainId: 'mock-captain',
        memberIds: ['mock-captain', 'mock-member-1', 'mock-member-2'],
        stats: { totalXP: 5000, avgLevel: 8, totalLessons: 25, rank: 1 },
        isPrivate: false,
        maxMembers: 6,
        description: 'Top performing VEX team',
        createdAt: new Date(),
        updatedAt: new Date(),
        assignedLessons: []
      },
      {
        id: 'mock-team-2',
        name: '123A',
        code: 'VRC123A',
        captainId: 'mock-captain-2',
        memberIds: ['mock-captain-2', 'mock-member-3'],
        stats: { totalXP: 4200, avgLevel: 7, totalLessons: 20, rank: 2 },
        isPrivate: false,
        maxMembers: 6,
        description: 'Competitive robotics team',
        createdAt: new Date(),
        updatedAt: new Date(),
        assignedLessons: []
      }
    ];
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
      const data = doc.data();
      teams.push({ 
        id: doc.id, 
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        // Ensure arrays exist
        memberIds: data.memberIds || [],
        assignedLessons: data.assignedLessons || []
      } as Team);
    });
    
    return teams;
  } catch (error) {
    console.error('Error getting available teams:', error);
    // Return mock data if Firebase fails
    return [
      {
        id: 'available-team-1',
        name: '456B',
        code: 'VRC456B',
        captainId: 'captain-1',
        memberIds: ['captain-1', 'member-1'],
        stats: { totalXP: 2000, avgLevel: 5, totalLessons: 10, rank: 5 },
        isPrivate: false,
        maxMembers: 6,
        description: 'Looking for new members to join our VEX team!',
        createdAt: new Date(),
        updatedAt: new Date(),
        assignedLessons: []
      },
      {
        id: 'available-team-2',
        name: '789C',
        code: 'VRC789C',
        captainId: 'captain-2',
        memberIds: ['captain-2'],
        stats: { totalXP: 1500, avgLevel: 4, totalLessons: 8, rank: 8 },
        isPrivate: false,
        maxMembers: 6,
        description: 'New team seeking motivated students',
        createdAt: new Date(),
        updatedAt: new Date(),
        assignedLessons: []
      }
    ];
  }
};
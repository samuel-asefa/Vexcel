export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'student' | 'captain';
  level: number;
  xp: number;
  teamId: string | null;
  completedLessons: string[];
  achievements: string[];
  streakDays: number;
  totalTimeSpent: number; // in minutes
  createdAt: Date;
  lastActive: Date;
  updatedAt?: Date;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockedAt?: Date;
  requirement: string;
}
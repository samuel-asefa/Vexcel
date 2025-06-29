export interface Team {
  id: string;
  name: string; // VRC format like "750W" or "123A"
  code: string;
  captainId: string;
  memberIds: string[];
  stats: {
    totalXP: number;
    avgLevel: number;
    totalLessons: number;
    rank: number;
  };
  isPrivate: boolean;
  maxMembers: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  assignedLessons: AssignedLesson[];
}

export interface AssignedLesson {
  id: string;
  lessonId: string;
  assignedTo: string[]; // student IDs
  assignedBy: string; // captain ID
  dueDate: Date;
  assignedAt: Date;
  completed: { studentId: string; completedAt: Date; score?: number }[];
}
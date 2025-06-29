export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'student' | 'captain';
  level: number;
  xp: number;
  teamId?: string;
  completedLessons: string[];
  achievements: string[];
  streakDays: number;
  totalTimeSpent: number; // in minutes
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  completed: boolean;
  locked: boolean;
  rating: number;
  students: number;
  sections: LessonSection[];
  quiz: Quiz;
  xpReward: number;
  assignedBy?: string; // captain ID who assigned this lesson
  assignedTo?: string[]; // student IDs this lesson is assigned to
  dueDate?: Date;
}

export interface LessonSection {
  id: string;
  title: string;
  content: string;
  timeSpent: number;
  videoUrl?: string;
  codeExamples?: CodeExample[];
}

export interface CodeExample {
  id: string;
  title: string;
  code: string;
  language: string;
  explanation: string;
}

export interface Quiz {
  id: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface Team {
  id: string;
  name: string; // VRC format like "750W" or "123A"
  code: string;
  captain: {
    id: string;
    name: string;
    avatar: string;
  };
  members: User[];
  stats: {
    totalXP: number;
    avgLevel: number;
    totalLessons: number;
    rank: number;
  };
  createdAt: Date;
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

// Mock Data
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Alex Chen',
    email: 'alex.chen@email.com',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    role: 'student',
    level: 12,
    xp: 2340,
    teamId: 'team-1',
    completedLessons: ['lesson-1', 'lesson-2', 'lesson-3'],
    achievements: ['first-lesson', 'quiz-master', 'team-player'],
    streakDays: 7,
    totalTimeSpent: 1485 // 24.75 hours
  },
  {
    id: '2',
    name: 'Maya Patel',
    email: 'maya.patel@email.com',
    avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    role: 'student',
    level: 15,
    xp: 3200,
    teamId: 'team-1',
    completedLessons: ['lesson-1', 'lesson-2', 'lesson-3', 'lesson-4', 'lesson-5'],
    achievements: ['first-lesson', 'quiz-master', 'speed-learner'],
    streakDays: 12,
    totalTimeSpent: 2160 // 36 hours
  },
  {
    id: '3',
    name: 'Jordan Kim',
    email: 'jordan.kim@email.com',
    avatar: 'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    role: 'student',
    level: 10,
    xp: 1890,
    teamId: 'team-1',
    completedLessons: ['lesson-1', 'lesson-2'],
    achievements: ['first-lesson'],
    streakDays: 3,
    totalTimeSpent: 945 // 15.75 hours
  }
];

export const mockLessons: Lesson[] = [
  {
    id: 'lesson-1',
    title: 'Introduction to VEX Robotics',
    description: 'Learn the fundamentals of VEX robotics, including basic components and assembly techniques.',
    duration: 30,
    difficulty: 'Beginner',
    category: 'Basics',
    completed: true,
    locked: false,
    rating: 4.8,
    students: 1250,
    xpReward: 100,
    sections: [
      {
        id: 'section-1',
        title: 'What is VEX Robotics?',
        content: 'VEX Robotics is an educational robotics platform designed to provide students with hands-on experience in STEM fields...',
        timeSpent: 0
      }
    ],
    quiz: {
      id: 'quiz-1',
      questions: [
        {
          id: 'q1',
          question: 'What is the main control unit in a VEX robotics system?',
          options: ['VEX Motor', 'VEX Brain', 'VEX Sensor', 'VEX Wheel'],
          correctAnswer: 1,
          explanation: 'The VEX Brain is the main control unit that processes your program and controls all the robot\'s components.',
          difficulty: 'Easy'
        }
      ]
    }
  },
  {
    id: 'lesson-2',
    title: 'Basic Programming Concepts',
    description: 'Master the basics of robot programming with VEXcode and understand fundamental programming principles.',
    duration: 45,
    difficulty: 'Beginner',
    category: 'Programming',
    completed: true,
    locked: false,
    rating: 4.9,
    students: 980,
    xpReward: 150,
    sections: [],
    quiz: { id: 'quiz-2', questions: [] }
  },
  {
    id: 'lesson-3',
    title: 'Advanced Sensor Integration',
    description: 'Deep dive into various VEX sensors, their applications, and advanced integration techniques.',
    duration: 60,
    difficulty: 'Advanced',
    category: 'Hardware',
    completed: false,
    locked: false,
    rating: 4.7,
    students: 420,
    xpReward: 200,
    sections: [],
    quiz: { id: 'quiz-3', questions: [] }
  },
  {
    id: 'lesson-4',
    title: 'Competition Strategies',
    description: 'Learn winning strategies and tactics for VEX competitions.',
    duration: 50,
    difficulty: 'Advanced',
    category: 'Competition',
    completed: false,
    locked: false,
    rating: 4.8,
    students: 650,
    xpReward: 250,
    sections: [],
    quiz: { id: 'quiz-4', questions: [] }
  },
  {
    id: 'lesson-5',
    title: 'Autonomous Programming',
    description: 'Master autonomous robot programming for competition success.',
    duration: 75,
    difficulty: 'Advanced',
    category: 'Programming',
    completed: false,
    locked: false,
    rating: 4.6,
    students: 320,
    xpReward: 300,
    sections: [],
    quiz: { id: 'quiz-5', questions: [] }
  }
];

export const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: '750W',
    code: 'VRC750W',
    captain: {
      id: 'captain-1',
      name: 'Sarah Johnson',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    },
    members: mockUsers,
    stats: {
      totalXP: 7430,
      avgLevel: 12.3,
      totalLessons: 8,
      rank: 3
    },
    createdAt: new Date('2024-01-15'),
    assignedLessons: [
      {
        id: 'assignment-1',
        lessonId: 'lesson-4',
        assignedTo: ['1', '2', '3'],
        assignedBy: 'captain-1',
        dueDate: new Date('2024-03-15'),
        assignedAt: new Date('2024-03-01'),
        completed: [
          { studentId: '2', completedAt: new Date('2024-03-05'), score: 96 }
        ]
      }
    ]
  },
  {
    id: 'team-2',
    name: '123A',
    code: 'VRC123A',
    captain: {
      id: 'captain-2',
      name: 'Michael Chen',
      avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    },
    members: [],
    stats: {
      totalXP: 12800,
      avgLevel: 16.5,
      totalLessons: 24,
      rank: 2
    },
    createdAt: new Date('2024-01-10'),
    assignedLessons: []
  },
  {
    id: 'team-3',
    name: '9999Z',
    code: 'VRC9999Z',
    captain: {
      id: 'captain-3',
      name: 'Emma Wilson',
      avatar: 'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    },
    members: [],
    stats: {
      totalXP: 15200,
      avgLevel: 18.2,
      totalLessons: 32,
      rank: 1
    },
    createdAt: new Date('2024-01-05'),
    assignedLessons: []
  }
];

export const mockAchievements: Achievement[] = [
  {
    id: 'first-lesson',
    title: 'First Steps',
    description: 'Complete your first lesson',
    icon: '🎯',
    color: 'from-green-400 to-green-600',
    unlocked: true,
    unlockedAt: new Date('2024-01-20'),
    requirement: 'Complete 1 lesson'
  },
  {
    id: 'quiz-master',
    title: 'Quiz Master',
    description: 'Score 90% or higher on 5 quizzes',
    icon: '🧠',
    color: 'from-blue-400 to-blue-600',
    unlocked: true,
    unlockedAt: new Date('2024-02-01'),
    requirement: 'Score 90%+ on 5 quizzes'
  },
  {
    id: 'speed-learner',
    title: 'Speed Learner',
    description: 'Complete 3 lessons in one day',
    icon: '⚡',
    color: 'from-yellow-400 to-yellow-600',
    unlocked: false,
    requirement: 'Complete 3 lessons in 24 hours'
  },
  {
    id: 'team-player',
    title: 'Team Player',
    description: 'Join a VEX team',
    icon: '👥',
    color: 'from-purple-400 to-purple-600',
    unlocked: true,
    unlockedAt: new Date('2024-01-25'),
    requirement: 'Join a team'
  },
  {
    id: 'perfect-score',
    title: 'Perfect Score',
    description: 'Score 100% on any quiz',
    icon: '🌟',
    color: 'from-orange-400 to-orange-600',
    unlocked: false,
    requirement: 'Score 100% on a quiz'
  },
  {
    id: 'competition-ready',
    title: 'Competition Ready',
    description: 'Complete all competition strategy lessons',
    icon: '🏆',
    color: 'from-red-400 to-red-600',
    unlocked: false,
    requirement: 'Complete competition category'
  }
];

// Leaderboard data with VRC team names
export const mockLeaderboard = [
  {
    id: 'team-3',
    name: '9999Z',
    captain: 'Emma Wilson',
    members: 5,
    totalXP: 15200,
    avgLevel: 18.2,
    rank: 1
  },
  {
    id: 'team-2',
    name: '123A',
    captain: 'Michael Chen',
    members: 4,
    totalXP: 12800,
    avgLevel: 16.5,
    rank: 2
  },
  {
    id: 'team-1',
    name: '750W',
    captain: 'Sarah Johnson',
    members: 3,
    totalXP: 7430,
    avgLevel: 12.3,
    rank: 3
  },
  {
    id: 'team-4',
    name: '456B',
    captain: 'David Park',
    members: 6,
    totalXP: 6950,
    avgLevel: 11.8,
    rank: 4
  },
  {
    id: 'team-5',
    name: '888X',
    captain: 'Lisa Zhang',
    members: 4,
    totalXP: 5200,
    avgLevel: 10.5,
    rank: 5
  }
];

export const mockAvailableTeams = [
  {
    id: 'team-6',
    name: '777Y',
    captain: 'Robert Taylor',
    members: 2,
    maxMembers: 5,
    description: 'Focused on advanced programming and autonomous systems.',
    isPrivate: false
  },
  {
    id: 'team-7',
    name: '555C',
    captain: 'Jennifer Lee',
    members: 3,
    maxMembers: 4,
    description: 'Creative problem solving and design thinking approach.',
    isPrivate: false
  }
];
export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  order: number;
  rating: number;
  students: number;
  sections: LessonSection[];
  quiz: Quiz;
  xpReward: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonSection {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  codeExamples?: CodeExample[];
  order: number;
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

export interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  sectionsCompleted: number[];
  quizCompleted: boolean;
  quizScore: number;
  timeSpent: number; // in minutes
  completed: boolean;
  completedAt: Date | null;
  lastAccessed: Date;
  createdAt: Date;
  updatedAt: Date;
}
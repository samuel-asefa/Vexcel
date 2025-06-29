// This file is kept for any remaining imports but exports empty data
// All data should now come from Firebase

export const mockAchievements = [
    {
      id: 'first-lesson',
      title: 'First Steps',
      description: 'Complete your first VEX lesson',
      icon: '🎯',
      color: 'from-blue-500 to-cyan-500',
      unlocked: true,
      requirement: 'Complete 1 lesson'
    },
    {
      id: 'quiz-master',
      title: 'Quiz Master',
      description: 'Score 100% on 5 quizzes',
      icon: '🧠',
      color: 'from-purple-500 to-pink-500',
      unlocked: true,
      requirement: 'Perfect score on 5 quizzes'
    },
    {
      id: 'team-player',
      title: 'Team Player',
      description: 'Join a VEX team',
      icon: '👥',
      color: 'from-green-500 to-emerald-500',
      unlocked: true,
      requirement: 'Join any team'
    },
    {
      id: 'speed-learner',
      title: 'Speed Learner',
      description: 'Complete 3 lessons in one day',
      icon: '⚡',
      color: 'from-yellow-500 to-orange-500',
      unlocked: false,
      requirement: 'Complete 3 lessons in 24 hours'
    },
    {
      id: 'dedication',
      title: 'Dedication',
      description: 'Maintain a 7-day learning streak',
      icon: '🔥',
      color: 'from-red-500 to-pink-500',
      unlocked: false,
      requirement: 'Learn for 7 consecutive days'
    }
  ];
  
  export const mockTeams = [];
  export const mockUsers = [];
  export const mockLessons = [];
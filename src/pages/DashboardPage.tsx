import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllLessons } from '../services/lessonService';
import { Lesson } from '../types/lesson';
import { 
  BookOpen, 
  Trophy, 
  Users, 
  Clock, 
  TrendingUp, 
  Star,
  Target,
  Calendar,
  Award,
  Zap,
  ArrowRight,
  Play,
  Loader2,
  AlertCircle
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user, isLoading: authLoading, error: authError } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || authLoading) return;
      
      try {
        setIsLoading(true);
        setError(null);
        console.log('Dashboard: Fetching lessons...');
        
        const lessonsData = await getAllLessons();
        console.log('Dashboard: Lessons loaded:', lessonsData?.length || 0);
        setLessons(lessonsData || []);
      } catch (err: any) {
        console.error('Dashboard: Error fetching data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading]);

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show auth error
  if (authError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Authentication Error</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{authError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show sign in prompt
  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Vexcel</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Please sign in to view your dashboard and start learning VEX robotics.</p>
          <Link 
            to="/" 
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200"
          >
            Go to Home Page
          </Link>
        </div>
      </div>
    );
  }

  // Show data loading
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show data error
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Safe array access with fallbacks
  const recentLessons = (lessons || []).slice(0, 3).map(lesson => ({
    ...lesson,
    progress: (user?.completedLessons || []).includes(lesson.id) ? 100 : Math.floor(Math.random() * 80) + 10
  }));

  // Generate dynamic weekly stats based on user data
  const generateWeeklyStats = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const completedCount = user?.completedLessons?.length || 0;
    const avgTimePerDay = Math.floor((user?.totalTimeSpent || 0) / 7);
    
    return days.map((day, index) => ({
      day,
      lessons: index < completedCount ? Math.floor(Math.random() * 3) + 1 : 0,
      time: index < completedCount ? avgTimePerDay + Math.floor(Math.random() * 30) : 0
    }));
  };

  const weeklyStats = generateWeeklyStats();
  const maxTime = Math.max(...weeklyStats.map(stat => stat.time), 1);

  const stats = [
    { 
      label: 'Current Level', 
      value: user?.level || 1, 
      icon: Trophy, 
      gradient: 'from-blue-500 to-cyan-500',
      change: user?.level > 1 ? '+1 this week' : 'Keep learning!'
    },
    { 
      label: 'Lessons Completed', 
      value: (user?.completedLessons || []).length, 
      icon: BookOpen, 
      gradient: 'from-green-500 to-emerald-500',
      change: `${(user?.completedLessons || []).length} total`
    },
    { 
      label: 'Time Spent', 
      value: `${Math.floor((user?.totalTimeSpent || 0) / 60)}h`, 
      icon: Clock, 
      gradient: 'from-purple-500 to-pink-500',
      change: `${Math.floor((user?.totalTimeSpent || 0) / 60)} hours total`
    },
    { 
      label: 'XP Earned', 
      value: (user?.xp || 0).toLocaleString(), 
      icon: TrendingUp, 
      gradient: 'from-yellow-500 to-orange-500',
      change: `Level ${user?.level || 1}`
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user?.name || 'Student'}! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Here's your learning progress and achievements.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              {index === 0 && user && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Progress to Level {(user.level || 1) + 1}</span>
                    <span>{(user.xp || 0) % 200}/200 XP</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${((user.xp || 0) % 200) / 200 * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
              <p className="text-sm text-green-600 dark:text-green-400 mt-2 font-medium">{stat.change}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Lessons */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Continue Learning</h2>
              <Link 
                to="/lessons" 
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium flex items-center space-x-1 group"
              >
                <span>View all lessons</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="space-y-4">
              {recentLessons && recentLessons.length > 0 ? recentLessons.map((lesson) => (
                <div key={lesson.id} className="group bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-4">
                    <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-r ${
                      lesson.difficulty === 'Beginner' ? 'from-green-500 to-emerald-500' :
                      lesson.difficulty === 'Intermediate' ? 'from-yellow-500 to-orange-500' :
                      'from-red-500 to-pink-500'
                    } rounded-xl flex items-center justify-center shadow-lg`}>
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{lesson.title}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{lesson.duration} min</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          lesson.difficulty === 'Beginner' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                          lesson.difficulty === 'Intermediate' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                          'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}>
                          {lesson.difficulty}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{lesson.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${lesson.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <Link
                      to={`/lessons/${lesson.id}`}
                      className="ml-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                    >
                      <Play className="w-4 h-4" />
                      <span>Continue</span>
                    </Link>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No lessons available</h3>
                  <p className="text-gray-600 dark:text-gray-400">Check back later for new content!</p>
                </div>
              )}
            </div>
          </div>

          {/* Weekly Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Weekly Activity</h2>
            <div className="flex items-end space-x-2 h-40 mb-4">
              {weeklyStats.map((stat, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center mb-2">
                    <div 
                      className="w-8 bg-gradient-to-t from-blue-600 to-cyan-500 rounded-t-lg mb-1 transition-all duration-500"
                      style={{ height: `${maxTime > 0 ? (stat.time / maxTime) * 120 : 0}px` }}
                    ></div>
                    <div className="text-xs font-semibold text-gray-900 dark:text-white">{stat.lessons}</div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.day}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>📚 Lessons completed</span>
              <span>⏱️ Minutes spent</span>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Achievements</h2>
          <div className="space-y-4">
            {user?.achievements && user.achievements.length > 0 ? user.achievements.slice(0, 3).map((achievementId, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                    🏆
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Achievement Unlocked</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Great progress!</p>
                    <div className="flex items-center mt-2">
                      <Star className="w-3 h-3 text-yellow-500 mr-1" />
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Unlocked</span>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No achievements yet</h3>
                <p className="text-gray-600 dark:text-gray-400">Complete lessons to unlock achievements!</p>
              </div>
            )}
          </div>
          
          {/* Next Achievement */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Next Achievement</h3>
                <p className="text-xs text-blue-700 dark:text-blue-300">Complete 5 lessons</p>
              </div>
              <div className="text-2xl">🎯</div>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300 mb-1">
                <span>Progress</span>
                <span>{Math.min((user?.completedLessons || []).length, 5)}/5</span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(((user?.completedLessons || []).length / 5) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllLessons, getUserLessonProgress } from '../services/lessonService';
import { Lesson, LessonProgress } from '../types/lesson';
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Lock, 
  Search, 
  Filter,
  Star,
  Play,
  Trophy,
  Users,
  Loader2,
  Wrench,
  Code,
  PenTool,
  FileText
} from 'lucide-react';

const LessonsPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonProgress, setLessonProgress] = useState<Record<string, LessonProgress>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setIsLoading(true);
        const lessonsData = await getAllLessons();
        setLessons(lessonsData || []);

        // Fetch progress for all lessons if user is authenticated
        if (user && lessonsData && lessonsData.length > 0) {
          const progressPromises = lessonsData.map(async (lesson) => {
            const progress = await getUserLessonProgress(user.id, lesson.id);
            return { lessonId: lesson.id, progress };
          });

          const progressResults = await Promise.all(progressPromises);
          const progressMap: Record<string, LessonProgress> = {};
          
          progressResults.forEach(({ lessonId, progress }) => {
            if (progress) {
              progressMap[lessonId] = progress;
            }
          });

          setLessonProgress(progressMap);
        }
      } catch (err) {
        console.error('Error fetching lessons:', err);
        setError('Failed to load lessons');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchLessons();
    }
  }, [authLoading, user]);

  if (authLoading || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Please sign in to view lessons</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Error</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  // Safe array operations with null checks
  const safeCategories = lessons && Array.isArray(lessons) 
    ? ['all', ...Array.from(new Set(lessons.map(lesson => lesson?.category).filter(Boolean)))]
    : ['all'];
  
  const difficulties = ['all', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredLessons = (lessons || []).filter(lesson => {
    if (!lesson) return false;
    
    const matchesSearch = (lesson.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (lesson.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = selectedDifficulty === 'all' || lesson.difficulty === selectedDifficulty;
    const matchesCategory = selectedCategory === 'all' || lesson.category === selectedCategory;
    
    return matchesSearch && matchesDifficulty && matchesCategory;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'Intermediate': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'Advanced': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Building': return Wrench;
      case 'Programming': return Code;
      case 'CAD': return PenTool;
      case 'Notebook': return FileText;
      default: return BookOpen;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Building': return 'from-orange-500 to-red-500';
      case 'Programming': return 'from-blue-600 to-blue-800';
      case 'CAD': return 'from-indigo-500 to-blue-600';
      case 'Notebook': return 'from-green-500 to-emerald-600';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  const userCompletedLessons = user?.completedLessons || [];
  const totalLessons = lessons?.length || 0;
  const completionPercentage = totalLessons > 0 ? Math.round((userCompletedLessons.length / totalLessons) * 100) : 0;

  // Group lessons by category for better organization
  const lessonsByCategory = filteredLessons.reduce((acc, lesson) => {
    const category = lesson.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(lesson);
    return acc;
  }, {} as Record<string, Lesson[]>);

  // Calculate lesson progress percentage
  const getLessonProgress = (lesson: Lesson) => {
    const isCompleted = userCompletedLessons.includes(lesson.id);
    const progress = lessonProgress[lesson.id];
    
    if (isCompleted) {
      return 100;
    } else if (progress) {
      // Calculate progress based on sections completed and quiz status
      const totalSections = lesson.sections.length;
      const completedSections = progress.sectionsCompleted.length;
      const sectionProgress = (completedSections / totalSections) * 90; // 90% for sections
      const quizProgress = progress.quizCompleted ? 10 : 0; // 10% for quiz
      return Math.round(sectionProgress + quizProgress);
    }
    
    return 0;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">VEX Learning Curriculum</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Master VEX robotics with our comprehensive lesson library organized by category. Track your progress and unlock advanced content.
        </p>
      </div>

      {/* Progress Overview */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 mb-8 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Your Learning Progress</h2>
            <p className="text-blue-100">
              {userCompletedLessons.length} of {totalLessons} lessons completed across all categories
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{user?.level || 1}</div>
              <div className="text-sm text-blue-200">Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{(user?.xp || 0).toLocaleString()}</div>
              <div className="text-sm text-blue-200">XP</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{completionPercentage}%</div>
              <div className="text-sm text-blue-200">Complete</div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm text-blue-200 mb-1">
            <span>Overall Progress</span>
            <span>{completionPercentage}%</span>
          </div>
          <div className="w-full bg-blue-400 bg-opacity-30 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-500" 
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Category Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {['Building', 'Programming', 'CAD', 'Notebook'].map((category) => {
          const Icon = getCategoryIcon(category);
          const categoryLessons = lessons.filter(lesson => lesson.category === category);
          const completedInCategory = categoryLessons.filter(lesson => userCompletedLessons.includes(lesson.id)).length;
          const categoryProgress = categoryLessons.length > 0 ? Math.round((completedInCategory / categoryLessons.length) * 100) : 0;
          
          return (
            <div key={category} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
              <div className={`w-12 h-12 bg-gradient-to-r ${getCategoryColor(category)} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{category}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{categoryLessons.length} lessons</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`bg-gradient-to-r ${getCategoryColor(category)} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${categoryProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{categoryProgress}% complete</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search lessons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {safeCategories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>
                  {difficulty === 'all' ? 'All Levels' : difficulty}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lessons by Category */}
      {selectedCategory === 'all' ? (
        Object.entries(lessonsByCategory).map(([category, categoryLessons]) => (
          <div key={category} className="mb-12">
            <div className="flex items-center mb-6">
              <div className={`w-10 h-10 bg-gradient-to-r ${getCategoryColor(category)} rounded-xl flex items-center justify-center mr-4`}>
                {React.createElement(getCategoryIcon(category), { className: "w-5 h-5 text-white" })}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{category}</h2>
                <p className="text-gray-600 dark:text-gray-400">{categoryLessons.length} lessons available</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryLessons.map((lesson) => {
                const isCompleted = userCompletedLessons.includes(lesson.id);
                const progressPercentage = getLessonProgress(lesson);
                const isLocked = false; // For now, no lessons are locked
                
                return (
                  <div key={lesson.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow ${isLocked ? 'opacity-60' : ''}`}>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 bg-gradient-to-r ${getCategoryColor(lesson.category || '')} rounded-xl flex items-center justify-center`}>
                          {React.createElement(getCategoryIcon(lesson.category || ''), { className: "w-6 h-6 text-white" })}
                        </div>
                        <div className="flex items-center space-x-2">
                          {isCompleted && (
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          )}
                          {isLocked && (
                            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                              <Lock className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{lesson.title || 'Untitled Lesson'}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{lesson.description || 'No description available'}</p>

                      <div className="flex items-center justify-between mb-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(lesson.difficulty || 'Beginner')}`}>
                          {lesson.difficulty || 'Beginner'}
                        </span>
                        <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>{lesson.duration || 0} min</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">{lesson.rating || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                          <Users className="w-4 h-4" />
                          <span>{lesson.students || 0}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <Trophy className="w-4 h-4" />
                          <span>+{lesson.xpReward || 0} XP</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-600 to-blue-800 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {!isLocked ? (
                        <Link
                          to={`/lessons/${lesson.id}`}
                          className={`w-full text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                            isCompleted 
                              ? 'bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700' 
                              : 'bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900'
                          }`}
                        >
                          <Play className="w-4 h-4" />
                          <span>{isCompleted ? 'Review' : 'Start Lesson'}</span>
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="w-full bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 py-2 px-4 rounded-lg font-medium cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                          <Lock className="w-4 h-4" />
                          <span>Complete previous lessons</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => {
            const isCompleted = userCompletedLessons.includes(lesson.id);
            const progressPercentage = getLessonProgress(lesson);
            const isLocked = false;
            
            return (
              <div key={lesson.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow ${isLocked ? 'opacity-60' : ''}`}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${getCategoryColor(lesson.category || '')} rounded-xl flex items-center justify-center`}>
                      {React.createElement(getCategoryIcon(lesson.category || ''), { className: "w-6 h-6 text-white" })}
                    </div>
                    <div className="flex items-center space-x-2">
                      {isCompleted && (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                      {isLocked && (
                        <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                          <Lock className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{lesson.title || 'Untitled Lesson'}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{lesson.description || 'No description available'}</p>

                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(lesson.difficulty || 'Beginner')}`}>
                      {lesson.difficulty || 'Beginner'}
                    </span>
                    <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{lesson.duration || 0} min</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{lesson.rating || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>{lesson.students || 0}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <Trophy className="w-4 h-4" />
                      <span>+{lesson.xpReward || 0} XP</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-blue-800 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {!isLocked ? (
                    <Link
                      to={`/lessons/${lesson.id}`}
                      className={`w-full text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                        isCompleted 
                          ? 'bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700' 
                          : 'bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900'
                      }`}
                    >
                      <Play className="w-4 h-4" />
                      <span>{isCompleted ? 'Review' : 'Start Lesson'}</span>
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 py-2 px-4 rounded-lg font-medium cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Complete previous lessons</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredLessons.length === 0 && (
        <div className="col-span-full text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No lessons found</h3>
          <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
};

export default LessonsPage;
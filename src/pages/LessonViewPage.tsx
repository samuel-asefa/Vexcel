import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  getLessonById, 
  getUserLessonProgress, 
  updateLessonProgress, 
  completeLessonQuiz 
} from '../services/lessonService';
import { updateUserProgress } from '../services/userService';
import { Lesson, LessonProgress } from '../types/lesson';
import { 
  ArrowLeft, 
  Clock, 
  BookOpen, 
  CheckCircle, 
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Star,
  Loader2,
  AlertCircle
} from 'lucide-react';

const LessonViewPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateUser, refreshUser } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState<Date>(new Date());

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !user) return;
      
      try {
        setIsLoading(true);
        setError(null);

        // Fetch lesson data
        const lessonData = await getLessonById(id);
        if (!lessonData) {
          setError('Lesson not found');
          return;
        }
        setLesson(lessonData);

        // Fetch user progress
        const progressData = await getUserLessonProgress(user.id, id);
        setProgress(progressData);

        // Set current section based on progress
        if (progressData && progressData.sectionsCompleted.length > 0) {
          const lastSection = Math.max(...progressData.sectionsCompleted);
          setCurrentSection(Math.min(lastSection + 1, lessonData.sections.length - 1));
        }

        // Check if quiz is completed
        if (progressData?.quizCompleted) {
          setIsQuizMode(true);
          setShowResults(true);
          setQuizScore(progressData.quizScore);
        }

      } catch (err: any) {
        console.error('Error fetching lesson data:', err);
        setError(err.message || 'Failed to load lesson');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    setStartTime(new Date());
  }, [id, user]);

  // Track time spent
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const handleSectionComplete = async () => {
    if (!lesson || !user) return;

    try {
      const currentTime = Math.floor((new Date().getTime() - startTime.getTime()) / 60000); // minutes
      await updateLessonProgress(user.id, lesson.id, currentSection, currentTime);
      
      // Update local progress
      setProgress(prev => {
        if (!prev) {
          return {
            id: `${user.id}_${lesson.id}`,
            userId: user.id,
            lessonId: lesson.id,
            sectionsCompleted: [currentSection],
            quizCompleted: false,
            quizScore: 0,
            timeSpent: currentTime,
            completed: false,
            completedAt: null,
            lastAccessed: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
        
        const newSections = [...prev.sectionsCompleted];
        if (!newSections.includes(currentSection)) {
          newSections.push(currentSection);
        }
        return { ...prev, sectionsCompleted: newSections };
      });

    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  const handleQuizAnswer = (answerIndex: number) => {
    if (!lesson?.quiz.questions[currentQuestionIndex]) return;
    
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (!lesson) return;
    
    if (currentQuestionIndex < lesson.quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate final score
      let correctAnswers = 0;
      lesson.quiz.questions.forEach((question, index) => {
        if (selectedAnswers[index] === question.correctAnswer) {
          correctAnswers++;
        }
      });
      
      setQuizScore(correctAnswers);
      setShowResults(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const completeLesson = async () => {
    if (!lesson || !user) return;

    try {
      const totalQuestions = lesson.quiz.questions.length;
      const currentTime = Math.floor((new Date().getTime() - startTime.getTime()) / 60000);
      
      // Complete quiz
      await completeLessonQuiz(user.id, lesson.id, quizScore, totalQuestions);
      
      // Update user progress if lesson is completed successfully
      const isCompleted = quizScore >= totalQuestions * 0.7; // 70% passing grade
      
      if (isCompleted) {
        await updateUserProgress(user.id, lesson.id, lesson.xpReward, currentTime);
        
        // Update local user state
        const newCompletedLessons = [...(user.completedLessons || [])];
        if (!newCompletedLessons.includes(lesson.id)) {
          newCompletedLessons.push(lesson.id);
        }
        
        await updateUser({
          completedLessons: newCompletedLessons,
          xp: (user.xp || 0) + lesson.xpReward,
          level: Math.floor(((user.xp || 0) + lesson.xpReward) / 200) + 1,
          totalTimeSpent: (user.totalTimeSpent || 0) + currentTime
        });

        // Refresh user data to ensure sync
        await refreshUser();
      }

      // Navigate back to lessons
      navigate('/lessons');
      
    } catch (err) {
      console.error('Error completing lesson:', err);
      setError('Failed to complete lesson');
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowResults(false);
    setQuizScore(0);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading lesson...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {error || 'Lesson not found'}
          </h1>
          <Link 
            to="/lessons" 
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-4 inline-block"
          >
            ← Back to lessons
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Please sign in to view lessons</h1>
        </div>
      </div>
    );
  }

  const totalSections = lesson.sections.length;
  const completedSections = progress?.sectionsCompleted.length || 0;
  const overallProgress = isQuizMode 
    ? showResults ? 100 : 90
    : Math.round(((currentSection + 1) / (totalSections + 1)) * 100);

  const currentQuestion = lesson.quiz.questions[currentQuestionIndex];
  const isQuizComplete = showResults;
  const passingGrade = Math.ceil(lesson.quiz.questions.length * 0.7);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          to="/lessons" 
          className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to lessons
        </Link>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{lesson.title}</h1>
              <p className="text-gray-600 dark:text-gray-400">{lesson.description}</p>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{lesson.duration} min</span>
              </div>
              <div className="flex items-center space-x-1">
                <Trophy className="w-4 h-4" />
                <span>+{lesson.xpReward} XP</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                lesson.difficulty === 'Beginner' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                lesson.difficulty === 'Intermediate' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
              }`}>
                {lesson.difficulty}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Progress</span>
              <span>{overallProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Section Navigation */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {lesson.sections.map((section, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentSection(index);
                  setIsQuizMode(false);
                  setShowResults(false);
                  setCurrentQuestionIndex(0);
                  setSelectedAnswers([]);
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                  currentSection === index && !isQuizMode
                    ? 'bg-blue-600 text-white'
                    : progress?.sectionsCompleted.includes(index)
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {progress?.sectionsCompleted.includes(index) && <CheckCircle className="w-3 h-3 inline mr-1" />}
                {index + 1}. {section.title}
              </button>
            ))}
            <button
              onClick={() => {
                setIsQuizMode(true);
                setCurrentQuestionIndex(0);
                if (!progress?.quizCompleted) {
                  setShowResults(false);
                  setSelectedAnswers([]);
                }
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                isQuizMode
                  ? 'bg-yellow-600 text-white'
                  : progress?.quizCompleted
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {progress?.quizCompleted && <CheckCircle className="w-3 h-3 inline mr-1" />}
              Quiz ({lesson.quiz.questions.length} questions)
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8">
        {!isQuizMode ? (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {lesson.sections[currentSection]?.title}
            </h2>
            <div className="prose max-w-none dark:prose-invert">
              {lesson.sections[currentSection]?.content.split('\n\n').map((paragraph, index) => {
                if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                  return (
                    <h3 key={index} className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                      {paragraph.replace(/\*\*/g, '')}
                    </h3>
                  );
                } else if (paragraph.includes('•')) {
                  const lines = paragraph.split('\n');
                  return (
                    <div key={index} className="mb-4">
                      {lines[0] && !lines[0].includes('•') && <p className="mb-2 text-gray-700 dark:text-gray-300">{lines[0]}</p>}
                      <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                        {lines.map((line, lineIndex) => 
                          line.trim().startsWith('•') && (
                            <li key={lineIndex}>{line.replace('•', '').trim()}</li>
                          )
                        )}
                      </ul>
                    </div>
                  );
                } else {
                  return (
                    <p key={index} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                      {paragraph}
                    </p>
                  );
                }
              })}
            </div>
          </div>
        ) : (
          <div>
            {!showResults ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Question {currentQuestionIndex + 1} of {lesson.quiz.questions.length}
                  </h2>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Quiz Progress: {Math.round(((currentQuestionIndex + 1) / lesson.quiz.questions.length) * 100)}%
                  </div>
                </div>
                
                {currentQuestion && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      {currentQuestion.question}
                    </h3>
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuizAnswer(index)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            selectedAnswers[currentQuestionIndex] === index
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
                              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="mr-3 w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm">
                              {String.fromCharCode(65 + index)}
                            </span>
                            {option}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Quiz Results</h2>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-lg mb-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      {quizScore}/{lesson.quiz.questions.length}
                    </div>
                    <div className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                      {Math.round((quizScore / lesson.quiz.questions.length) * 100)}% Correct
                    </div>
                    <div className={`text-lg font-semibold ${
                      quizScore >= passingGrade 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {quizScore >= passingGrade ? '🎉 Passed!' : '❌ Try Again'}
                    </div>
                    {quizScore < passingGrade && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        You need {passingGrade} correct answers to pass.
                      </p>
                    )}
                  </div>
                </div>

                {/* Question Review */}
                <div className="space-y-4">
                  {lesson.quiz.questions.map((question, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        {index + 1}. {question.question}
                      </h4>
                      <div className="text-sm">
                        <div className={`mb-1 ${
                          selectedAnswers[index] === question.correctAnswer 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          Your answer: {question.options[selectedAnswers[index]] || 'Not answered'}
                        </div>
                        <div className="text-green-600 dark:text-green-400 mb-2">
                          Correct answer: {question.options[question.correctAnswer]}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {question.explanation}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => {
            if (isQuizMode && !showResults && currentQuestionIndex > 0) {
              handlePreviousQuestion();
            } else if (isQuizMode && showResults) {
              setIsQuizMode(false);
              setCurrentSection(lesson.sections.length - 1);
              setShowResults(false);
              setCurrentQuestionIndex(0);
              setSelectedAnswers([]);
            } else if (isQuizMode) {
              setIsQuizMode(false);
              setCurrentSection(lesson.sections.length - 1);
            } else if (currentSection > 0) {
              setCurrentSection(currentSection - 1);
            }
          }}
          disabled={currentSection === 0 && !isQuizMode}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <BookOpen className="w-4 h-4" />
          <span>
            {isQuizMode 
              ? showResults 
                ? 'Quiz Complete' 
                : `Question ${currentQuestionIndex + 1}/${lesson.quiz.questions.length}`
              : `Section ${currentSection + 1} of ${lesson.sections.length}`
            }
          </span>
        </div>

        {!isQuizMode && currentSection < lesson.sections.length - 1 ? (
          <button
            onClick={() => {
              handleSectionComplete();
              setCurrentSection(currentSection + 1);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>Next</span>
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </button>
        ) : !isQuizMode && currentSection === lesson.sections.length - 1 ? (
          <button
            onClick={() => {
              handleSectionComplete();
              setIsQuizMode(true);
              setCurrentQuestionIndex(0);
              setSelectedAnswers([]);
              setShowResults(false);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <span>Take Quiz</span>
            <Trophy className="w-4 h-4" />
          </button>
        ) : isQuizMode && !showResults ? (
          <button
            onClick={handleNextQuestion}
            disabled={selectedAnswers[currentQuestionIndex] === undefined}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>{currentQuestionIndex === lesson.quiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}</span>
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </button>
        ) : isQuizMode && showResults ? (
          <div className="flex space-x-2">
            {quizScore < passingGrade && (
              <button
                onClick={resetQuiz}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Quiz</span>
              </button>
            )}
            <button
              onClick={completeLesson}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <span>{quizScore >= passingGrade ? 'Complete Lesson' : 'Continue Anyway'}</span>
              <Star className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div></div>
        )}
      </div>
    </div>
  );
};

export default LessonViewPage;
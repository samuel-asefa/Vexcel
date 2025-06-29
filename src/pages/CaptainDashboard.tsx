import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mockTeams, mockLessons, mockUsers } from '../data/mockData';
import { 
  Users, 
  BookOpen, 
  Trophy, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Download,
  Eye,
  Filter,
  Plus,
  Send,
  X
} from 'lucide-react';

const CaptainDashboard: React.FC = () => {
  const { user } = useAuth();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');

  // Find captain's team
  const myTeam = mockTeams.find(team => team.captain.id === user?.id);
  
  if (!myTeam) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Captain Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">You need to be a team captain to access this page.</p>
        </div>
      </div>
    );
  }

  const teamOverview = {
    totalStudents: myTeam.members.length,
    activeStudents: myTeam.members.filter(m => m.streakDays > 0).length,
    totalLessonsCompleted: myTeam.members.reduce((sum, m) => sum + m.completedLessons.length, 0),
    avgCompletionRate: Math.round(myTeam.members.reduce((sum, m) => sum + (m.completedLessons.length / mockLessons.length * 100), 0) / myTeam.members.length),
    totalTimeSpent: Math.round(myTeam.members.reduce((sum, m) => sum + m.totalTimeSpent, 0) / 60) // convert to hours
  };

  const recentQuizResults = [
    {
      studentName: 'Maya Patel',
      lessonTitle: 'Competition Strategies',
      score: 96,
      completedAt: '2 hours ago',
      timeSpent: '8 minutes',
      incorrectAnswers: ['Question 3: Team coordination timing']
    },
    {
      studentName: 'Alex Chen',
      lessonTitle: 'Advanced Sensor Programming',
      score: 88,
      completedAt: '5 hours ago',
      timeSpent: '12 minutes',
      incorrectAnswers: ['Question 2: Ultrasonic sensor range', 'Question 7: Sensor calibration']
    },
    {
      studentName: 'Jordan Kim',
      lessonTitle: 'Basic Programming Concepts',
      score: 92,
      completedAt: '1 day ago',
      timeSpent: '10 minutes',
      incorrectAnswers: ['Question 5: Loop optimization']
    }
  ];

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
    if (progress >= 70) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
  };

  const getActivityStatus = (lastActive: string) => {
    if (lastActive.includes('hour')) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
    if (lastActive.includes('day') && parseInt(lastActive) <= 2) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
  };

  const handleAssignLesson = () => {
    if (!selectedLesson || selectedStudents.length === 0 || !dueDate) return;
    
    // In a real app, this would make an API call
    console.log('Assigning lesson:', {
      lessonId: selectedLesson,
      studentIds: selectedStudents,
      dueDate: new Date(dueDate),
      assignedBy: user?.id
    });
    
    // Reset form
    setSelectedLesson('');
    setSelectedStudents([]);
    setDueDate('');
    setShowAssignModal(false);
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Captain Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Monitor Team {myTeam.name}'s progress, assign lessons, and track learning engagement.
            </p>
          </div>
          <button
            onClick={() => setShowAssignModal(true)}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            <span>Assign Lesson</span>
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {[
          { label: 'Total Students', value: teamOverview.totalStudents, icon: Users, gradient: 'from-blue-500 to-cyan-500' },
          { label: 'Active This Week', value: teamOverview.activeStudents, icon: TrendingUp, gradient: 'from-green-500 to-emerald-500' },
          { label: 'Lessons Completed', value: teamOverview.totalLessonsCompleted, icon: BookOpen, gradient: 'from-purple-500 to-pink-500' },
          { label: 'Completion Rate', value: `${teamOverview.avgCompletionRate}%`, icon: Trophy, gradient: 'from-yellow-500 to-orange-500' },
          { label: 'Total Time', value: `${teamOverview.totalTimeSpent}h`, icon: Clock, gradient: 'from-red-500 to-pink-500' }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Student Progress */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Student Progress</h2>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {myTeam.members.map((student) => {
                const completionRate = (student.completedLessons.length / mockLessons.length) * 100;
                const lastActive = `${Math.floor(Math.random() * 3) + 1} ${Math.random() > 0.5 ? 'hours' : 'days'} ago`;
                
                return (
                  <div key={student.id} className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/20"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{student.name}</h3>
                          <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                            <span>Level {student.level}</span>
                            <span>{student.xp.toLocaleString()} XP</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActivityStatus(lastActive)}`}>
                              {lastActive}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Current Lesson Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>Overall Progress</span>
                        <span>{Math.round(completionRate)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${completionRate}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Weekly Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {student.completedLessons.length}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Lessons</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {Math.round(student.totalTimeSpent / 60)}h
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Time Spent</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${getProgressColor(completionRate).split(' ')[0]} ${getProgressColor(completionRate).split(' ')[1]}`}>
                          {Math.round(completionRate)}%
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Completion</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Quiz Results */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Quiz Results</h2>
          <div className="space-y-4">
            {recentQuizResults.map((result, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{result.studentName}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{result.lessonTitle}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getProgressColor(result.score)}`}>
                    {result.score}%
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <span>{result.completedAt}</span>
                  <span>{result.timeSpent}</span>
                </div>

                {result.incorrectAnswers.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2">
                    <p className="text-xs font-medium text-red-800 dark:text-red-300 mb-1">Incorrect Answers:</p>
                    <ul className="text-xs text-red-700 dark:text-red-400 space-y-1">
                      {result.incorrectAnswers.map((answer, answerIndex) => (
                        <li key={answerIndex}>• {answer}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Insights */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Team Insights
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Maya consistently scores above 90%</li>
              <li>• Jordan needs help with programming concepts</li>
              <li>• Alex shows improvement in sensor topics</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Assign Lesson Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Assign Lesson</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Select Lesson */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Lesson
                </label>
                <select
                  value={selectedLesson}
                  onChange={(e) => setSelectedLesson(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Choose a lesson...</option>
                  {mockLessons.map(lesson => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.title} ({lesson.difficulty})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Students */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Students
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {myTeam.members.map(student => (
                    <label key={student.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => toggleStudentSelection(student.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <img
                        src={student.avatar}
                        alt={student.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm text-gray-900 dark:text-white">{student.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignLesson}
                disabled={!selectedLesson || selectedStudents.length === 0 || !dueDate}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Assign</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptainDashboard;
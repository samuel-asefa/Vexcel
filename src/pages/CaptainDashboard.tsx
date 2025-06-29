import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTeamById, assignLessonToTeam } from '../services/teamService';
import { getUsersByTeam } from '../services/userService';
import { getAllLessons } from '../services/lessonService';
import { Team } from '../types/team';
import { User } from '../types/user';
import { Lesson } from '../types/lesson';
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
  X,
  Loader2,
  Crown
} from 'lucide-react';

const CaptainDashboard: React.FC = () => {
  const { user } = useAuth();
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        setError(null);

        // Check if user is a captain and has a team
        if (user.role !== 'captain' || !user.teamId) {
          setError('You need to be a team captain to access this page.');
          return;
        }

        // Fetch team data
        const team = await getTeamById(user.teamId);
        if (!team) {
          setError('Team not found.');
          return;
        }

        if (team.captainId !== user.id) {
          setError('You are not the captain of this team.');
          return;
        }

        setMyTeam(team);

        // Fetch team members
        const members = await getUsersByTeam(user.teamId);
        setTeamMembers(members);

        // Fetch all lessons
        const lessonsData = await getAllLessons();
        setLessons(lessonsData || []);

      } catch (err: any) {
        console.error('Error fetching captain dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleAssignLesson = async () => {
    if (!selectedLesson || selectedStudents.length === 0 || !dueDate || !myTeam) return;
    
    try {
      setIsAssigning(true);
      setError(null);

      await assignLessonToTeam(
        myTeam.id,
        selectedLesson,
        user!.id,
        selectedStudents,
        new Date(dueDate)
      );

      // Reset form
      setSelectedLesson('');
      setSelectedStudents([]);
      setDueDate('');
      setShowAssignModal(false);

      // Refresh team data
      const updatedTeam = await getTeamById(myTeam.id);
      setMyTeam(updatedTeam);

    } catch (err: any) {
      console.error('Error assigning lesson:', err);
      setError(err.message || 'Failed to assign lesson');
    } finally {
      setIsAssigning(false);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
    if (progress >= 70) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
  };

  const getActivityStatus = (lastActive: Date) => {
    const now = new Date();
    const diffHours = Math.abs(now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
    if (diffHours < 48) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
  };

  const formatLastActive = (lastActive: Date) => {
    const now = new Date();
    const diffHours = Math.abs(now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${Math.floor(diffHours)} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading captain dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  if (!myTeam) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="text-center">
          <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Team Found</h1>
          <p className="text-gray-600 dark:text-gray-400">You need to be a team captain to access this page.</p>
        </div>
      </div>
    );
  }

  const teamOverview = {
    totalStudents: teamMembers.length,
    activeStudents: teamMembers.filter(m => {
      const diffHours = Math.abs(new Date().getTime() - m.lastActive.getTime()) / (1000 * 60 * 60);
      return diffHours < 168; // Active in last week
    }).length,
    totalLessonsCompleted: teamMembers.reduce((sum, m) => sum + m.completedLessons.length, 0),
    avgCompletionRate: teamMembers.length > 0 
      ? Math.round(teamMembers.reduce((sum, m) => sum + (m.completedLessons.length / Math.max(lessons.length, 1) * 100), 0) / teamMembers.length)
      : 0,
    totalTimeSpent: Math.round(teamMembers.reduce((sum, m) => sum + m.totalTimeSpent, 0) / 60) // convert to hours
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
              {teamMembers.filter(member => member.id !== myTeam.captainId).map((student) => {
                const completionRate = lessons.length > 0 ? (student.completedLessons.length / lessons.length) * 100 : 0;
                const lastActive = formatLastActive(student.lastActive);
                
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
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActivityStatus(student.lastActive)}`}>
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
              
              {teamMembers.filter(member => member.id !== myTeam.captainId).length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No students yet</h3>
                  <p className="text-gray-600 dark:text-gray-400">Invite students to join your team to start tracking their progress.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assigned Lessons */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Assigned Lessons</h2>
          <div className="space-y-4">
            {myTeam.assignedLessons && myTeam.assignedLessons.length > 0 ? myTeam.assignedLessons.map((assignment, index) => {
              const lesson = lessons.find(l => l.id === assignment.lessonId);
              const completedCount = assignment.completed.length;
              const totalAssigned = assignment.assignedTo.length;
              
              return (
                <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {lesson?.title || 'Unknown Lesson'}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Due: {assignment.dueDate.toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getProgressColor((completedCount / totalAssigned) * 100)}`}>
                      {completedCount}/{totalAssigned}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <span>Assigned {assignment.assignedAt.toLocaleDateString()}</span>
                    <span>{totalAssigned} students</span>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${totalAssigned > 0 ? (completedCount / totalAssigned) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No lessons assigned</h3>
                <p className="text-gray-600 dark:text-gray-400">Start by assigning lessons to your team members.</p>
              </div>
            )}
          </div>

          {/* Team Insights */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Team Insights
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Team has {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}</li>
              <li>• Average level: {teamMembers.length > 0 ? (teamMembers.reduce((sum, m) => sum + m.level, 0) / teamMembers.length).toFixed(1) : 0}</li>
              <li>• Total XP: {teamMembers.reduce((sum, m) => sum + m.xp, 0).toLocaleString()}</li>
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
                  {lessons.map(lesson => (
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
                  {teamMembers.filter(member => member.id !== myTeam.captainId).map(student => (
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
                  
                  {teamMembers.filter(member => member.id !== myTeam.captainId).length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No students in your team yet.</p>
                  )}
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
                  min={new Date().toISOString().split('T')[0]}
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
                disabled={!selectedLesson || selectedStudents.length === 0 || !dueDate || isAssigning}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{isAssigning ? 'Assigning...' : 'Assign'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptainDashboard;
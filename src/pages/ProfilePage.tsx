import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mockAchievements } from '../data/mockData';
import { 
  User, 
  Trophy, 
  BookOpen, 
  Clock, 
  Star,
  Award,
  TrendingUp,
  Calendar,
  Edit3,
  Save,
  X
} from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  if (!user) return null;

  const stats = [
    { label: 'Current Level', value: user.level, icon: Trophy, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Total XP', value: user.xp, icon: Star, color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
    { label: 'Lessons Completed', value: user.completedLessons.length, icon: BookOpen, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'Time Spent', value: `${Math.floor(user.totalTimeSpent / 60)}h`, icon: Clock, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30' }
  ];

  const recentActivity = [
    { type: 'lesson', title: 'Completed "Advanced Sensor Programming"', date: '2 hours ago', icon: BookOpen, color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
    { type: 'achievement', title: 'Unlocked "Quiz Master" achievement', date: '1 day ago', icon: Award, color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' },
    { type: 'level', title: 'Reached Level 12', date: '3 days ago', icon: Trophy, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
    { type: 'team', title: 'Joined 750W team', date: '1 week ago', icon: User, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' }
  ];

  const handleSave = () => {
    updateUser(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      name: user.name,
      email: user.email
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 rounded-2xl p-8 text-white mb-8 shadow-xl">
        <div className="flex items-center space-x-6">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-24 h-24 rounded-full object-cover border-4 border-white/20 shadow-lg"
          />
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/70 w-full backdrop-blur-sm"
                  placeholder="Full Name"
                />
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/70 w-full backdrop-blur-sm"
                  placeholder="Email"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 flex items-center space-x-1 transition-all duration-200"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/30 flex items-center space-x-1 transition-all duration-200"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold">{user.name}</h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-blue-100 mb-4">{user.email}</p>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold">{user.level}</span>
                    </div>
                    <span className="text-blue-100">Level {user.level}</span>
                  </div>
                  <div className="text-blue-100">{user.xp} XP</div>
                  <div className="text-blue-100 capitalize">{user.role}</div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Level Progress */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-blue-200 mb-2">
            <span>Progress to Level {user.level + 1}</span>
            <span>{user.xp % 200}/200 XP</span>
          </div>
          <div className="w-full bg-blue-400/30 rounded-full h-3">
            <div 
              className="bg-white h-3 rounded-full transition-all duration-500" 
              style={{ width: `${(user.xp % 200) / 200 * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Stats */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Statistics</h2>
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center group">
                    <div className={`w-16 h-16 ${stat.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform duration-200`}>
                      <Icon className={`w-8 h-8 ${stat.color}`} />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`w-10 h-10 ${activity.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{activity.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Achievements</h2>
          <div className="space-y-4">
            {mockAchievements.map((achievement, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  achievement.unlocked
                    ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 ${
                    achievement.unlocked 
                      ? `bg-gradient-to-r ${achievement.color}` 
                      : 'bg-gray-400 dark:bg-gray-600'
                  } rounded-xl flex items-center justify-center text-xl shadow-lg`}>
                    {achievement.unlocked ? achievement.icon : '🔒'}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${
                      achievement.unlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {achievement.title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{achievement.description}</p>
                    {achievement.unlocked && (
                      <div className="flex items-center mt-2">
                        <Star className="w-3 h-3 text-yellow-500 mr-1" />
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">Unlocked</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Next Achievement */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Next Achievement</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">Speed Learner</p>
            <div className="text-xs text-blue-600 dark:text-blue-400 mb-2">Complete 3 lessons in one day</div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2 rounded-full transition-all duration-500" style={{ width: '40%' }}></div>
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">2/3 lessons completed today</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
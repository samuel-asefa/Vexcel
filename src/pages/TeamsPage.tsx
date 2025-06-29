import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mockTeams, mockLeaderboard, mockAvailableTeams } from '../data/mockData';
import { 
  Users, 
  Crown, 
  Trophy, 
  TrendingUp, 
  Calendar,
  BookOpen,
  Clock,
  Star,
  Plus,
  Search,
  Filter
} from 'lucide-react';

const TeamsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'my-team' | 'leaderboard' | 'join'>('my-team');

  // Find user's team
  const myTeam = mockTeams.find(team => team.id === user?.teamId);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Teams</h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Collaborate with teammates, track progress, and compete with other VEX teams.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'my-team', name: 'My Team', icon: Users },
            { id: 'leaderboard', name: 'Leaderboard', icon: Trophy },
            { id: 'join', name: 'Join Team', icon: Plus }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* My Team Tab */}
      {activeTab === 'my-team' && myTeam && (
        <div className="space-y-8">
          {/* Team Overview */}
          <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">Team {myTeam.name}</h2>
                <p className="text-blue-100">Team Code: {myTeam.code}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{getRankIcon(myTeam.stats.rank)}</div>
                <div className="text-sm text-blue-200">Team Rank</div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{myTeam.stats.totalXP.toLocaleString()}</div>
                <div className="text-sm text-blue-200">Total XP</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{myTeam.stats.avgLevel}</div>
                <div className="text-sm text-blue-200">Avg Level</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{myTeam.stats.totalLessons}</div>
                <div className="text-sm text-blue-200">Lessons Done</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{myTeam.members.length}</div>
                <div className="text-sm text-blue-200">Members</div>
              </div>
            </div>
          </div>

          {/* Captain */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Crown className="w-6 h-6 text-yellow-500 mr-2" />
              Team Captain
            </h3>
            <div className="flex items-center space-x-4">
              <img
                src={myTeam.captain.avatar}
                alt={myTeam.captain.name}
                className="w-16 h-16 rounded-full object-cover ring-4 ring-yellow-500/20"
              />
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{myTeam.captain.name}</h4>
                <p className="text-gray-600 dark:text-gray-400">Team Captain & Mentor</p>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Team Members</h3>
            <div className="space-y-4">
              {myTeam.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-4">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/20"
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{member.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>Level {member.level}</span>
                        <span>{member.xp.toLocaleString()} XP</span>
                        <span>{member.completedLessons.length} lessons</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Progress</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">This week</div>
                    </div>
                    <div className="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                      <div 
                        className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500" 
                        style={{ width: `${(member.completedLessons.length / 12) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">VEX Team Leaderboard</h3>
          <div className="space-y-4">
            {mockLeaderboard.map((team, index) => (
              <div
                key={team.id}
                className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                  team.id === myTeam?.id 
                    ? 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800' 
                    : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-3xl font-bold w-16 text-center">
                    {getRankIcon(team.rank)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-lg">Team {team.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Captain: {team.captain} • {team.members} members
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900 dark:text-white text-lg">{team.totalXP.toLocaleString()} XP</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg Level: {team.avgLevel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Join Team Tab */}
      {activeTab === 'join' && (
        <div className="space-y-8">
          {/* Join by Code */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Join Team by Code</h3>
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Enter team code (e.g., VRC750W)..."
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl">
                Join Team
              </button>
            </div>
          </div>

          {/* Available Teams */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Available VEX Teams</h3>
            <div className="space-y-4">
              {mockAvailableTeams.map((team) => (
                <div key={team.id} className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-2">Team {team.name}</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{team.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>Captain: {team.captain}</span>
                        <span>
                          {team.members}/{team.maxMembers} members
                        </span>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl">
                      Request to Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create Team */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-purple-100" />
              <h3 className="text-2xl font-bold mb-2">Create Your Own VEX Team</h3>
              <p className="text-purple-100 mb-6 text-lg">
                Start your own team and invite friends to learn together.
              </p>
              <button className="bg-white text-purple-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl">
                Create Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
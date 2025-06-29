import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getTeamById, 
  getTeamByCode, 
  joinTeam, 
  leaveTeam, 
  createTeam,
  getTeamLeaderboard,
  getAvailableTeams 
} from '../services/teamService';
import { getUsersByTeam } from '../services/userService';
import { Team } from '../types/team';
import { User } from '../types/user';
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
  Filter,
  Loader2,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';

const TeamsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'my-team' | 'leaderboard' | 'join'>('my-team');
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [leaderboard, setLeaderboard] = useState<Team[]>([]);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [createTeamData, setCreateTeamData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    maxMembers: 6
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        setError(null);

        // Fetch user's team if they have one
        if (user.teamId) {
          const team = await getTeamById(user.teamId);
          if (team) {
            setMyTeam(team);
            // Fetch team members
            const members = await getUsersByTeam(user.teamId);
            setTeamMembers(members);
          }
        }

        // Fetch leaderboard
        const leaderboardData = await getTeamLeaderboard(10);
        setLeaderboard(leaderboardData || []);

        // Fetch available teams
        const availableTeamsData = await getAvailableTeams();
        setAvailableTeams((availableTeamsData || []).filter(team => team.id !== user.teamId));

      } catch (err: any) {
        console.error('Error fetching teams data:', err);
        setError(err.message || 'Failed to load teams data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleJoinByCode = async () => {
    if (!joinCode.trim() || !user) return;

    try {
      setIsJoining(true);
      setError(null);

      const team = await getTeamByCode(joinCode.trim());
      if (!team) {
        throw new Error('Team not found with that code');
      }

      if ((team.memberIds || []).length >= team.maxMembers) {
        throw new Error('Team is full');
      }

      if ((team.memberIds || []).includes(user.id)) {
        throw new Error('You are already a member of this team');
      }

      await joinTeam(team.id, user.id);
      await updateUser({ teamId: team.id });

      // Refresh data
      setMyTeam(team);
      const members = await getUsersByTeam(team.id);
      setTeamMembers(members);
      setJoinCode('');
      setActiveTab('my-team');

    } catch (err: any) {
      console.error('Error joining team:', err);
      setError(err.message || 'Failed to join team');
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinTeam = async (teamId: string) => {
    if (!user) return;

    try {
      setIsJoining(true);
      setError(null);

      const team = await getTeamById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      if ((team.memberIds || []).length >= team.maxMembers) {
        throw new Error('Team is full');
      }

      await joinTeam(teamId, user.id);
      await updateUser({ teamId });

      // Refresh data
      setMyTeam(team);
      const members = await getUsersByTeam(teamId);
      setTeamMembers(members);
      setActiveTab('my-team');

    } catch (err: any) {
      console.error('Error joining team:', err);
      setError(err.message || 'Failed to join team');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!user || !myTeam) return;

    if (myTeam.captainId === user.id) {
      setError('Captains cannot leave their team. Transfer leadership first.');
      return;
    }

    try {
      setIsJoining(true);
      setError(null);

      await leaveTeam(myTeam.id, user.id);
      await updateUser({ teamId: null });

      setMyTeam(null);
      setTeamMembers([]);
      setActiveTab('join');

    } catch (err: any) {
      console.error('Error leaving team:', err);
      setError(err.message || 'Failed to leave team');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!user || !createTeamData.name.trim()) return;

    try {
      setIsJoining(true);
      setError(null);

      const teamCode = `VRC${createTeamData.name.toUpperCase().replace(/\s+/g, '')}`;
      
      const newTeam: Omit<Team, 'id'> = {
        name: createTeamData.name.trim(),
        code: teamCode,
        captainId: user.id,
        memberIds: [user.id],
        stats: {
          totalXP: user.xp || 0,
          avgLevel: user.level || 1,
          totalLessons: (user.completedLessons || []).length,
          rank: 0
        },
        isPrivate: createTeamData.isPrivate,
        maxMembers: createTeamData.maxMembers,
        description: createTeamData.description.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
        assignedLessons: []
      };

      const teamId = await createTeam(newTeam);
      await updateUser({ teamId, role: 'captain' });

      // Reset form and refresh data
      setCreateTeamData({ name: '', description: '', isPrivate: false, maxMembers: 6 });
      setShowCreateTeam(false);
      
      const team = await getTeamById(teamId);
      setMyTeam(team);
      setTeamMembers([user]);
      setActiveTab('my-team');

    } catch (err: any) {
      console.error('Error creating team:', err);
      setError(err.message || 'Failed to create team');
    } finally {
      setIsJoining(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  // Calculate team stats dynamically
  const calculateTeamStats = (team: Team, members: User[]) => {
    const totalXP = members.reduce((sum, member) => sum + (member.xp || 0), 0);
    const avgLevel = members.length > 0 ? members.reduce((sum, member) => sum + (member.level || 1), 0) / members.length : 1;
    const totalLessons = members.reduce((sum, member) => sum + (member.completedLessons || []).length, 0);
    
    return {
      totalXP,
      avgLevel: Math.round(avgLevel * 10) / 10,
      totalLessons,
      memberCount: members.length
    };
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading teams data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Please sign in to view teams</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Teams</h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Collaborate with teammates, track progress, and compete with other VEX teams.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'my-team', name: myTeam ? 'My Team' : 'No Team', icon: Users },
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
      {activeTab === 'my-team' && (
        <div className="space-y-8">
          {myTeam ? (
            <>
              {/* Team Overview */}
              <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Team {myTeam.name}</h2>
                    <p className="text-blue-100">Team Code: {myTeam.code}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold">{getRankIcon(myTeam.stats?.rank || 0)}</div>
                    <div className="text-sm text-blue-200">Team Rank</div>
                  </div>
                </div>
                
                {(() => {
                  const stats = calculateTeamStats(myTeam, teamMembers);
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold">{stats.totalXP.toLocaleString()}</div>
                        <div className="text-sm text-blue-200">Total XP</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold">{stats.avgLevel}</div>
                        <div className="text-sm text-blue-200">Avg Level</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold">{stats.totalLessons}</div>
                        <div className="text-sm text-blue-200">Lessons Done</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold">{stats.memberCount}</div>
                        <div className="text-sm text-blue-200">Members</div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Captain */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Crown className="w-6 h-6 text-yellow-500 mr-2" />
                  Team Captain
                </h3>
                {(() => {
                  const captain = teamMembers.find(member => member.id === myTeam.captainId);
                  return captain ? (
                    <div className="flex items-center space-x-4">
                      <img
                        src={captain.avatar}
                        alt="Captain"
                        className="w-16 h-16 rounded-full object-cover ring-4 ring-yellow-500/20"
                      />
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {captain.name}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">Team Captain & Mentor</p>
                        <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <span>Level {captain.level}</span>
                          <span>{captain.xp.toLocaleString()} XP</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">Captain information not available</p>
                  );
                })()}
              </div>

              {/* Team Members */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Team Members</h3>
                  {myTeam.captainId !== user.id && (
                    <button
                      onClick={handleLeaveTeam}
                      disabled={isJoining}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isJoining ? 'Leaving...' : 'Leave Team'}
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center space-x-4">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/20"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                            {member.name}
                            {member.id === myTeam.captainId && (
                              <Crown className="w-4 h-4 text-yellow-500 ml-2" />
                            )}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>Level {member.level || 1}</span>
                            <span>{(member.xp || 0).toLocaleString()} XP</span>
                            <span>{(member.completedLessons || []).length} lessons</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {Math.round(((member.completedLessons || []).length / Math.max(teamMembers.reduce((max, m) => Math.max(max, (m.completedLessons || []).length), 1), 1)) * 100)}%
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Progress</div>
                        </div>
                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                          <div 
                            className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500" 
                            style={{ 
                              width: `${Math.round(((member.completedLessons || []).length / Math.max(teamMembers.reduce((max, m) => Math.max(max, (m.completedLessons || []).length), 1), 1)) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">You're not on a team yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Join an existing team or create your own to start collaborating!</p>
              <button
                onClick={() => setActiveTab('join')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200"
              >
                Find a Team
              </button>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">VEX Team Leaderboard</h3>
          <div className="space-y-4">
            {leaderboard.length > 0 ? leaderboard.map((team, index) => (
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
                    {getRankIcon(index + 1)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-lg">Team {team.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {(team.memberIds || []).length} members
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900 dark:text-white text-lg">
                    {(team.stats?.totalXP || 0).toLocaleString()} XP
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Avg Level: {(team.stats?.avgLevel || 1).toFixed(1)}
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No teams found</p>
              </div>
            )}
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
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button 
                onClick={handleJoinByCode}
                disabled={!joinCode.trim() || isJoining}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {isJoining ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Join Team'}
              </button>
            </div>
          </div>

          {/* Available Teams */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Available VEX Teams</h3>
            <div className="space-y-4">
              {availableTeams.length > 0 ? availableTeams.map((team) => (
                <div key={team.id} className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-2">Team {team.name}</h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                        {team.description || 'No description available'}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>
                          {(team.memberIds || []).length}/{team.maxMembers} members
                        </span>
                        <span>Code: {team.code}</span>
                        <span>{(team.stats?.totalXP || 0).toLocaleString()} XP</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleJoinTeam(team.id)}
                      disabled={isJoining || (team.memberIds || []).length >= team.maxMembers}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                    >
                      {(team.memberIds || []).length >= team.maxMembers ? 'Full' : isJoining ? 'Joining...' : 'Join'}
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No available teams found</p>
                </div>
              )}
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
              <button 
                onClick={() => setShowCreateTeam(true)}
                className="bg-white text-purple-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Create Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create New Team</h3>
              <button
                onClick={() => setShowCreateTeam(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Team Name (e.g., 750W)
                </label>
                <input
                  type="text"
                  value={createTeamData.name}
                  onChange={(e) => setCreateTeamData({ ...createTeamData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter team name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={createTeamData.description}
                  onChange={(e) => setCreateTeamData({ ...createTeamData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Describe your team"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Members
                </label>
                <select
                  value={createTeamData.maxMembers}
                  onChange={(e) => setCreateTeamData({ ...createTeamData, maxMembers: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={4}>4 members</option>
                  <option value={6}>6 members</option>
                  <option value={8}>8 members</option>
                  <option value={10}>10 members</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={createTeamData.isPrivate}
                  onChange={(e) => setCreateTeamData({ ...createTeamData, isPrivate: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isPrivate" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Private team (invite only)
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateTeam(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTeam}
                disabled={!createTeamData.name.trim() || isJoining}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Create Team</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
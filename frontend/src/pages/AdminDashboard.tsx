import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import Spinner from '../components/Spinner';
import './AdminDashboard.css';

interface DashboardStats {
  totalUsers: number;
  totalPlayers: number;
  totalTeams: number;
  totalMatches: number;
  upcomingMatches: number;
  completedMatches: number;
}

interface RecentActivity {
  id: string;
  type: 'user_registered' | 'match_completed' | 'team_created' | 'tournament_created';
  description: string;
  timestamp: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load dashboard statistics
      const [users, players, teams, matches, tournaments] = await Promise.all([
        api.listUsers(),
        api.listPlayers(),
        api.listTeams(),
        api.listMatches(),
        api.listTournaments()
      ]);

      const upcomingMatches = matches.filter((match: any) => match.status === 'Upcoming').length;
      const completedMatches = matches.filter((match: any) => match.status === 'Finished').length;

      setStats({
        totalUsers: users.length,
        totalPlayers: players.length,
        totalTeams: teams.length,
        totalMatches: matches.length,
        upcomingMatches,
        completedMatches
      });

      // Generate recent activity from real data
      const activities: RecentActivity[] = [];
      
      // Add recent user registrations
      const recentUsers = users
        .sort((a: any, b: any) => new Date(b.joindate).getTime() - new Date(a.joindate).getTime())
        .slice(0, 3);
      
      recentUsers.forEach((user: any) => {
        activities.push({
          id: `user_${user.userid}`,
          type: 'user_registered',
          description: `New ${user.role.toLowerCase()} ${user.firstname} ${user.lastname} registered`,
          timestamp: user.joindate
        });
      });

      // Add recent matches
      const recentMatches = matches
        .filter((match: any) => match.status === 'Finished')
        .sort((a: any, b: any) => new Date(b.matchdate).getTime() - new Date(a.matchdate).getTime())
        .slice(0, 2);
      
      recentMatches.forEach((match: any) => {
        activities.push({
          id: `match_${match.matchid}`,
          type: 'match_completed',
          description: `Match: ${match.hometeamname} vs ${match.awayteamname} completed`,
          timestamp: match.matchdate
        });
      });

      // Add recent teams
      const recentTeams = teams
        .sort((a: any, b: any) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime())
        .slice(0, 2);
      
      recentTeams.forEach((team: any) => {
        activities.push({
          id: `team_${team.teamid}`,
          type: 'team_created',
          description: `New team "${team.teamname}" created`,
          timestamp: team.createdat
        });
      });

      // Sort activities by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 5)); // Show only 5 most recent

    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered':
        return '👤';
      case 'match_completed':
        return '⚽';
      case 'team_created':
        return '🏆';
      case 'tournament_created':
        return '🎯';
      default:
        return '📝';
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <Spinner color="white" size="lg" />
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-container">
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button onClick={loadDashboardData} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back, {user?.firstname} {user?.lastname}</p>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('matches')}
        >
          Match Management
        </button>
        <button 
          className={`tab ${activeTab === 'tournaments' ? 'active' : ''}`}
          onClick={() => setActiveTab('tournaments')}
        >
          Tournaments
        </button>
        <button 
          className={`tab ${activeTab === 'tournament-teams' ? 'active' : ''}`}
          onClick={() => setActiveTab('tournament-teams')}
        >
          Tournament Teams
        </button>
        <button 
          className={`tab ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          Groups
        </button>
        <button 
          className={`tab ${activeTab === 'teams' ? 'active' : ''}`}
          onClick={() => setActiveTab('teams')}
        >
          Teams
        </button>
        <button 
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>{stats?.totalUsers || 0}</h3>
                  <p>Total Users</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⚽</div>
                <div className="stat-info">
                  <h3>{stats?.totalPlayers || 0}</h3>
                  <p>Players</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🏆</div>
                <div className="stat-info">
                  <h3>{stats?.totalTeams || 0}</h3>
                  <p>Teams</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-info">
                  <h3>{stats?.totalMatches || 0}</h3>
                  <p>Total Matches</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏰</div>
                <div className="stat-info">
                  <h3>{stats?.upcomingMatches || 0}</h3>
                  <p>Upcoming</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h3>{stats?.completedMatches || 0}</h3>
                  <p>Finished</p>
                </div>
              </div>
            </div>

            <div className="recent-activity">
              <h2>Recent Activity</h2>
              <div className="activity-list">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="activity-content">
                      <p>{activity.description}</p>
                      <span className="activity-time">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="matches-tab">
            <MatchManagement onMatchResultEntered={loadDashboardData} />
          </div>
        )}

        {activeTab === 'tournaments' && (
          <div className="tournaments-tab">
            <TournamentManagement />
          </div>
        )}

        {activeTab === 'tournament-teams' && (
          <div className="tournament-teams-tab">
            <TournamentTeamManagement />
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="groups-tab">
            <GroupManagement />
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="teams-tab">
            <TeamManagement />
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-tab">
            <UserManagement />
          </div>
        )}
      </div>
    </div>
  );
};

// Match Management Component
const MatchManagement: React.FC<{ onMatchResultEntered?: () => void }> = ({ onMatchResultEntered }) => {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResultForm, setShowResultForm] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const matchesData = await api.listMatches();
      setMatches(matchesData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterResult = (match: any) => {
    setSelectedMatch(match);
    setShowResultForm(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <Spinner color="white" size="lg" />;
  }

  return (
    <div className="match-management">
      <div className="section-header">
        <h2>Match Management</h2>
        <button className="primary-btn" onClick={() => setShowResultForm(true)}>
          Enter Match Result
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="matches-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Home Team</th>
              <th>Away Team</th>
              <th>Round</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => (
              <tr key={match.matchid}>
                <td>{formatDate(match.matchdate)}</td>
                <td>{match.hometeamname || 'TBD'}</td>
                <td>{match.awayteamname || 'TBD'}</td>
                <td>{match.round}</td>
                <td>
                  <span className={`status-badge ${match.status.toLowerCase()}`}>
                    {match.status}
                  </span>
                </td>
                <td>
                  {match.status === 'Upcoming' && (
                    <button 
                      className="action-btn"
                      onClick={() => handleEnterResult(match)}
                    >
                      Enter Result
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showResultForm && (
        <MatchResultForm 
          match={selectedMatch}
          onClose={() => setShowResultForm(false)}
          onSuccess={() => {
            setShowResultForm(false);
            loadMatches();
            onMatchResultEntered?.();
          }}
        />
      )}
    </div>
  );
};

// Match Result Form Component
const MatchResultForm: React.FC<{
  match: any;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ match, onClose, onSuccess }) => {
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [homeGoalScorers, setHomeGoalScorers] = useState<any[]>([]);
  const [awayGoalScorers, setAwayGoalScorers] = useState<any[]>([]);
  const [homePlayers, setHomePlayers] = useState<any[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (match) {
      loadTeamPlayers();
    }
  }, [match]);

  const loadTeamPlayers = async () => {
    try {
      const [homePlayersData, awayPlayersData] = await Promise.all([
        api.listPlayers({ teamid: match.hometeamid }),
        api.listPlayers({ teamid: match.awayteamid })
      ]);
      setHomePlayers(homePlayersData || []);
      setAwayPlayers(awayPlayersData || []);
    } catch (err) {
      console.error('Failed to load team players:', err);
    }
  };

  const addGoalScorer = (teamType: 'home' | 'away') => {
    const newScorer = {
      playerid: '',
      minute: '',
      isowngoal: 0
    };
    
    if (teamType === 'home') {
      setHomeGoalScorers([...homeGoalScorers, newScorer]);
    } else {
      setAwayGoalScorers([...awayGoalScorers, newScorer]);
    }
  };

  const removeGoalScorer = (teamType: 'home' | 'away', index: number) => {
    if (teamType === 'home') {
      setHomeGoalScorers(homeGoalScorers.filter((_, i) => i !== index));
    } else {
      setAwayGoalScorers(awayGoalScorers.filter((_, i) => i !== index));
    }
  };

  const updateGoalScorer = (teamType: 'home' | 'away', index: number, field: string, value: any) => {
    if (teamType === 'home') {
      const updated = [...homeGoalScorers];
      updated[index] = { ...updated[index], [field]: value };
      setHomeGoalScorers(updated);
    } else {
      const updated = [...awayGoalScorers];
      updated[index] = { ...updated[index], [field]: value };
      setAwayGoalScorers(updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!homeScore || !awayScore) {
      setError('Please enter both scores');
      return;
    }

    const homeScoreNum = parseInt(homeScore);
    const awayScoreNum = parseInt(awayScore);

    // Validate goal scorers match the scores
    if (homeGoalScorers.length !== homeScoreNum) {
      setError(`Home team has ${homeScoreNum} goals but ${homeGoalScorers.length} goal scorers specified`);
      return;
    }

    if (awayGoalScorers.length !== awayScoreNum) {
      setError(`Away team has ${awayScoreNum} goals but ${awayGoalScorers.length} goal scorers specified`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create match result with goal scorers
      await api.createMatchResult({
        matchid: match.matchid,
        homescore: homeScoreNum,
        awayscore: awayScoreNum,
        home_goal_scorers: homeGoalScorers.map(scorer => ({
          playerid: parseInt(scorer.playerid),
          minute: scorer.minute ? parseInt(scorer.minute) : null,
          isowngoal: scorer.isowngoal
        })),
        away_goal_scorers: awayGoalScorers.map(scorer => ({
          playerid: parseInt(scorer.playerid),
          minute: scorer.minute ? parseInt(scorer.minute) : null,
          isowngoal: scorer.isowngoal
        }))
      });

      // Update match status to finished
      await api.updateMatch(match.matchid, {
        status: 'Finished'
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save match result');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Enter Match Result</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Match: {match?.hometeamname || 'Home Team'} vs {match?.awayteamname || 'Away Team'}</label>
          </div>
          
          <div className="score-inputs">
            <div className="form-group">
              <label>Home Team Score</label>
              <input
                type="number"
                min="0"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Away Team Score</label>
              <input
                type="number"
                min="0"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Home Team Goal Scorers */}
          <div className="goal-scorers-section">
            <div className="goal-scorers-header">
              <h4>{match?.hometeamname || 'Home Team'} Goal Scorers</h4>
              <button 
                type="button" 
                className="add-scorer-btn"
                onClick={() => addGoalScorer('home')}
              >
                + Add Scorer
              </button>
            </div>
            {homeGoalScorers.map((scorer, index) => (
              <div key={index} className="goal-scorer-row">
                <select
                  value={scorer.playerid}
                  onChange={(e) => updateGoalScorer('home', index, 'playerid', e.target.value)}
                  required
                >
                  <option value="">Select Player</option>
                  {homePlayers.map(player => (
                    <option key={player.playerid} value={player.playerid}>
                      {player.firstname} {player.lastname}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Minute"
                  min="1"
                  max="90"
                  value={scorer.minute}
                  onChange={(e) => updateGoalScorer('home', index, 'minute', e.target.value)}
                />
                <label className="own-goal-checkbox">
                  <input
                    type="checkbox"
                    checked={scorer.isowngoal === 1}
                    onChange={(e) => updateGoalScorer('home', index, 'isowngoal', e.target.checked ? 1 : 0)}
                  />
                  Own Goal
                </label>
                <button 
                  type="button" 
                  className="remove-scorer-btn"
                  onClick={() => removeGoalScorer('home', index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Away Team Goal Scorers */}
          <div className="goal-scorers-section">
            <div className="goal-scorers-header">
              <h4>{match?.awayteamname || 'Away Team'} Goal Scorers</h4>
              <button 
                type="button" 
                className="add-scorer-btn"
                onClick={() => addGoalScorer('away')}
              >
                + Add Scorer
              </button>
            </div>
            {awayGoalScorers.map((scorer, index) => (
              <div key={index} className="goal-scorer-row">
                <select
                  value={scorer.playerid}
                  onChange={(e) => updateGoalScorer('away', index, 'playerid', e.target.value)}
                  required
                >
                  <option value="">Select Player</option>
                  {awayPlayers.map(player => (
                    <option key={player.playerid} value={player.playerid}>
                      {player.firstname} {player.lastname}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Minute"
                  min="1"
                  max="90"
                  value={scorer.minute}
                  onChange={(e) => updateGoalScorer('away', index, 'minute', e.target.value)}
                />
                <label className="own-goal-checkbox">
                  <input
                    type="checkbox"
                    checked={scorer.isowngoal === 1}
                    onChange={(e) => updateGoalScorer('away', index, 'isowngoal', e.target.checked ? 1 : 0)}
                  />
                  Own Goal
                </label>
                <button 
                  type="button" 
                  className="remove-scorer-btn"
                  onClick={() => removeGoalScorer('away', index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="secondary-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="primary-btn">
              {loading ? 'Saving...' : 'Save Result'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Tournament Management Component
const TournamentManagement: React.FC = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const tournamentsData = await api.listTournaments();
      setTournaments(tournamentsData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner color="white" size="lg" />;
  }

  return (
    <div className="tournament-management">
      <div className="section-header">
        <h2>Tournament Management</h2>
        <button className="primary-btn" onClick={() => setShowCreateForm(true)}>
          Create Tournament
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="tournaments-grid">
        {tournaments.map((tournament) => (
          <div key={tournament.tournamentid} className="tournament-card">
            <h3>{tournament.name}</h3>
            <p>Season: {tournament.seasonyear}</p>
            <p>Start: {tournament.startdate ? new Date(tournament.startdate).toLocaleDateString() : 'TBD'}</p>
            <p>End: {tournament.enddate ? new Date(tournament.enddate).toLocaleDateString() : 'TBD'}</p>
            {tournament.description && (
              <p className="description">{tournament.description}</p>
            )}
          </div>
        ))}
      </div>

      {showCreateForm && (
        <TournamentCreateForm 
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            loadTournaments();
          }}
        />
      )}
    </div>
  );
};

// Tournament Create Form Component
const TournamentCreateForm: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    seasonyear: new Date().getFullYear(),
    startdate: '',
    enddate: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      await api.createTournament(formData);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Create Tournament</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tournament Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Season Year</label>
            <input
              type="number"
              value={formData.seasonyear}
              onChange={(e) => setFormData({...formData, seasonyear: parseInt(e.target.value)})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={formData.startdate}
              onChange={(e) => setFormData({...formData, startdate: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              value={formData.enddate}
              onChange={(e) => setFormData({...formData, enddate: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="secondary-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="primary-btn">
              {loading ? 'Creating...' : 'Create Tournament'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Team Management Component
const TeamManagement: React.FC = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const teamsData = await api.listTeams();
      setTeams(teamsData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner color="white" size="lg" />;
  }

  return (
    <div className="team-management">
      <div className="section-header">
        <h2>Team Management</h2>
        <button className="primary-btn" onClick={() => setShowCreateForm(true)}>
          Create Team
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="teams-grid">
        {teams.map((team) => (
          <div key={team.teamid} className="team-card">
            <div className="team-logo">
              {team.logourl ? (
                <img src={team.logourl} alt={team.teamname} />
              ) : (
                <div className="default-logo">🏆</div>
              )}
            </div>
            <h3>{team.teamname}</h3>
            {team.description && (
              <p className="description">{team.description}</p>
            )}
            <p className="created-date">
              Created: {new Date(team.createdat).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      {showCreateForm && (
        <TeamCreateForm 
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            loadTeams();
          }}
        />
      )}
    </div>
  );
};

// Team Create Form Component
const TeamCreateForm: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    teamname: '',
    description: '',
    logourl: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      await api.createTeam(formData);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Create Team</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Team Name</label>
            <input
              type="text"
              value={formData.teamname}
              onChange={(e) => setFormData({...formData, teamname: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Logo URL</label>
            <input
              type="url"
              value={formData.logourl}
              onChange={(e) => setFormData({...formData, logourl: e.target.value})}
              placeholder="https://example.com/logo.png"
            />
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="secondary-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="primary-btn">
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Tournament Team Management Component
const TournamentTeamManagement: React.FC = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [tournamentTeams, setTournamentTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAssignTeamForm, setShowAssignTeamForm] = useState(false);

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      loadTournamentTeamData();
    }
  }, [selectedTournament]);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const tournamentsData = await api.listTournaments();
      setTournaments(tournamentsData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const loadTournamentTeamData = async () => {
    if (!selectedTournament) return;
    
    try {
      setLoading(true);
      const [teamsData, tournamentTeamsData] = await Promise.all([
        api.listTeams(),
        api.listTournamentTeams()
      ]);

      // Filter tournament teams for selected tournament
      const tournamentTeamEntries = tournamentTeamsData.filter((entry: any) => 
        entry.tournamentid === selectedTournament.tournamentid
      );

      setTeams(teamsData || []);
      setTournamentTeams(tournamentTeamEntries);
    } catch (err: any) {
      setError(err.message || 'Failed to load tournament team data');
    } finally {
      setLoading(false);
    }
  };

  const getRegisteredTeams = () => {
    const registeredTeamIds = tournamentTeams.map((tt: any) => tt.teamid);
    return teams.filter((team: any) => registeredTeamIds.includes(team.teamid));
  };

  const getAvailableTeams = () => {
    const registeredTeamIds = tournamentTeams.map((tt: any) => tt.teamid);
    return teams.filter((team: any) => !registeredTeamIds.includes(team.teamid));
  };

  const handleRegisterTeam = async (teamid: number) => {
    try {
      setLoading(true);
      setError(null);

      await api.createTournamentTeam({
        tournamentid: selectedTournament.tournamentid,
        teamid: teamid
      });

      loadTournamentTeamData();
    } catch (err: any) {
      setError(err.message || 'Failed to register team');
    } finally {
      setLoading(false);
    }
  };

  const handleUnregisterTeam = async (teamid: number) => {
    try {
      setLoading(true);
      setError(null);

      await api.deleteTournamentTeam(selectedTournament.tournamentid, teamid);
      loadTournamentTeamData();
    } catch (err: any) {
      setError(err.message || 'Failed to unregister team');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !selectedTournament) {
    return <Spinner color="white" size="lg" />;
  }

  return (
    <div className="tournament-team-management">
      <div className="section-header">
        <h2>Tournament Team Management</h2>
        <p className="section-subtitle">Register teams for tournaments before assigning them to groups</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Tournament Selection */}
      <div className="tournament-selector">
        <label>Select Tournament:</label>
        <select 
          value={selectedTournament?.tournamentid || ''} 
          onChange={(e) => {
            const tournament = tournaments.find(t => t.tournamentid === parseInt(e.target.value));
            setSelectedTournament(tournament);
          }}
          className="tournament-select"
        >
          <option value="">Choose a tournament...</option>
          {tournaments.map((tournament) => (
            <option key={tournament.tournamentid} value={tournament.tournamentid}>
              {tournament.name} ({tournament.seasonyear})
            </option>
          ))}
        </select>
      </div>

      {selectedTournament && (
        <>
          <div className="tournament-info">
            <h3>{selectedTournament.name}</h3>
            <p>Season: {selectedTournament.seasonyear}</p>
            <p>Registered Teams: {tournamentTeams.length}</p>
            <p>Available Teams: {getAvailableTeams().length}</p>
          </div>

          <div className="team-registration-section">
            <div className="registered-teams">
              <div className="section-header-small">
                <h4>Registered Teams ({getRegisteredTeams().length})</h4>
                <p>Teams registered for this tournament</p>
              </div>
              
              {getRegisteredTeams().length === 0 ? (
                <div className="no-teams">
                  <p>No teams registered yet</p>
                  <small>Register teams to make them available for group assignment</small>
                </div>
              ) : (
                <div className="teams-grid">
                  {getRegisteredTeams().map((team: any) => (
                    <div key={team.teamid} className="team-card">
                      <div className="team-logo">
                        {team.logourl ? (
                          <img src={team.logourl} alt={team.teamname} />
                        ) : (
                          <div className="default-logo">🏆</div>
                        )}
                      </div>
                      <h5>{team.teamname}</h5>
                      {team.description && (
                        <p className="description">{team.description}</p>
                      )}
                      <button 
                        className="remove-btn"
                        onClick={() => handleUnregisterTeam(team.teamid)}
                        disabled={loading}
                      >
                        Unregister
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="available-teams">
              <div className="section-header-small">
                <h4>Available Teams ({getAvailableTeams().length})</h4>
                <p>Teams that can be registered for this tournament</p>
              </div>
              
              {getAvailableTeams().length === 0 ? (
                <div className="no-teams">
                  <p>All teams are already registered</p>
                </div>
              ) : (
                <div className="teams-grid">
                  {getAvailableTeams().map((team: any) => (
                    <div key={team.teamid} className="team-card">
                      <div className="team-logo">
                        {team.logourl ? (
                          <img src={team.logourl} alt={team.teamname} />
                        ) : (
                          <div className="default-logo">🏆</div>
                        )}
                      </div>
                      <h5>{team.teamname}</h5>
                      {team.description && (
                        <p className="description">{team.description}</p>
                      )}
                      <button 
                        className="register-btn"
                        onClick={() => handleRegisterTeam(team.teamid)}
                        disabled={loading}
                      >
                        Register
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="tournament-workflow">
            <h4>Tournament Workflow</h4>
            <div className="workflow-steps">
              <div className="workflow-step completed">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h5>Create Tournament</h5>
                  <p>Tournament created: {selectedTournament.name}</p>
                </div>
              </div>
              <div className={`workflow-step ${tournamentTeams.length > 0 ? 'completed' : 'current'}`}>
                <div className="step-number">2</div>
                <div className="step-content">
                  <h5>Register Teams</h5>
                  <p>{tournamentTeams.length} teams registered</p>
                </div>
              </div>
              <div className="workflow-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h5>Create Groups</h5>
                  <p>Organize teams into groups</p>
                </div>
              </div>
              <div className="workflow-step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h5>Schedule Matches</h5>
                  <p>Create match fixtures</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Group Management Component
const GroupManagement: React.FC = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [tournamentTeams, setTournamentTeams] = useState<any[]>([]);
  const [groupTeams, setGroupTeams] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateGroupForm, setShowCreateGroupForm] = useState(false);
  const [showAssignTeamForm, setShowAssignTeamForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      loadTournamentData();
    }
  }, [selectedTournament]);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const tournamentsData = await api.listTournaments();
      setTournaments(tournamentsData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const loadTournamentData = async () => {
    if (!selectedTournament) return;
    
    try {
      setLoading(true);
      const [groupsData, teamsData, tournamentTeamsData, groupTeamsData, standingsData, matchesData] = await Promise.all([
        api.listTournamentGroups(),
        api.listTeams(),
        api.listTournamentTeams(),
        api.listGroupTeams(),
        api.listStandings(),
        api.listMatches()
      ]);

      // Filter data for selected tournament
      const tournamentGroups = groupsData.filter((group: any) => group.tournamentid === selectedTournament.tournamentid);
      const tournamentTeamEntries = tournamentTeamsData.filter((entry: any) => entry.tournamentid === selectedTournament.tournamentid);
      const tournamentGroupTeams = groupTeamsData.filter((entry: any) => 
        tournamentGroups.some((group: any) => group.groupid === entry.groupid)
      );
      const tournamentStandings = standingsData.filter((standing: any) => 
        tournamentGroups.some((group: any) => group.groupid === standing.groupid)
      );
      const tournamentMatches = matchesData.filter((match: any) => match.tournamentid === selectedTournament.tournamentid);

      setGroups(tournamentGroups);
      setTeams(teamsData || []);
      setTournamentTeams(tournamentTeamEntries);
      setGroupTeams(tournamentGroupTeams);
      setStandings(tournamentStandings);
      setMatches(tournamentMatches);
    } catch (err: any) {
      setError(err.message || 'Failed to load tournament data');
    } finally {
      setLoading(false);
    }
  };

  const getTeamsInGroup = (groupid: number) => {
    const groupTeamIds = groupTeams
      .filter((gt: any) => gt.groupid === groupid)
      .map((gt: any) => gt.teamid);
    
    return teams.filter((team: any) => groupTeamIds.includes(team.teamid));
  };

  const getGroupStandings = (groupid: number) => {
    const groupStandings = standings.filter((standing: any) => standing.groupid === groupid);
    
    // Sort standings by points, then goal difference, then goals for
    return groupStandings.sort((a: any, b: any) => {
      if (b.points !== a.points) return b.points - a.points;
      if ((b.goalsfor - b.goalsagainst) !== (a.goalsfor - a.goalsagainst)) {
        return (b.goalsfor - b.goalsagainst) - (a.goalsfor - a.goalsagainst);
      }
      return b.goalsfor - a.goalsfor;
    });
  };

  const getGroupMatches = (groupid: number) => {
    const groupTeamIds = groupTeams
      .filter((gt: any) => gt.groupid === groupid)
      .map((gt: any) => gt.teamid);
    
    return matches.filter((match: any) => 
      groupTeamIds.includes(match.hometeamid) && groupTeamIds.includes(match.awayteamid)
    );
  };

  const getGroupStats = (groupid: number) => {
    const groupMatches = getGroupMatches(groupid);
    const groupStandings = getGroupStandings(groupid);
    
    const totalMatches = groupMatches.length;
    const completedMatches = groupMatches.filter((match: any) => match.status === 'Finished').length;
    const upcomingMatches = groupMatches.filter((match: any) => match.status === 'Upcoming').length;
    
    return {
      totalMatches,
      completedMatches,
      upcomingMatches,
      teamsCount: groupStandings.length
    };
  };

  const getAvailableTeams = () => {
    const tournamentTeamIds = tournamentTeams.map((tt: any) => tt.teamid);
    return teams.filter((team: any) => tournamentTeamIds.includes(team.teamid));
  };

  const getUnregisteredTeams = () => {
    const tournamentTeamIds = tournamentTeams.map((tt: any) => tt.teamid);
    return teams.filter((team: any) => !tournamentTeamIds.includes(team.teamid));
  };

  if (loading && !selectedTournament) {
    return <Spinner color="white" size="lg" />;
  }

  return (
    <div className="group-management">
      <div className="section-header">
        <h2>Tournament Group Management</h2>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Tournament Selection */}
      <div className="tournament-selector">
        <label>Select Tournament:</label>
        <select 
          value={selectedTournament?.tournamentid || ''} 
          onChange={(e) => {
            const tournament = tournaments.find(t => t.tournamentid === parseInt(e.target.value));
            setSelectedTournament(tournament);
          }}
          className="tournament-select"
        >
          <option value="">Choose a tournament...</option>
          {tournaments.map((tournament) => (
            <option key={tournament.tournamentid} value={tournament.tournamentid}>
              {tournament.name} ({tournament.seasonyear})
            </option>
          ))}
        </select>
      </div>

      {selectedTournament && (
        <>
          <div className="tournament-info">
            <h3>{selectedTournament.name}</h3>
            <p>Season: {selectedTournament.seasonyear}</p>
            <p>Registered Teams: {tournamentTeams.length}</p>
            <p>Groups: {groups.length}</p>
          </div>

          <div className="groups-section">
            <div className="groups-header">
              <div className="groups-title">
                <h3>Groups</h3>
                <p className="groups-subtitle">Live standings update automatically when match results are entered</p>
              </div>
              <div className="groups-actions">
                <button 
                  className="secondary-btn"
                  onClick={loadTournamentData}
                  disabled={loading}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
                <button 
                  className="primary-btn"
                  onClick={() => setShowCreateGroupForm(true)}
                >
                  Create Group
                </button>
              </div>
            </div>

            {tournamentTeams.length === 0 ? (
              <div className="no-groups">
                <p>No teams registered for this tournament yet.</p>
                <p>Go to <strong>Tournament Teams</strong> tab to register teams first, then create groups.</p>
              </div>
            ) : groups.length === 0 ? (
              <div className="no-groups">
                <p>No groups created yet. Create your first group to organize teams.</p>
                <p>{tournamentTeams.length} teams are registered and ready for group assignment.</p>
              </div>
            ) : (
              <div className="groups-grid">
                {groups.map((group) => {
                  const groupStats = getGroupStats(group.groupid);
                  const groupStandings = getGroupStandings(group.groupid);
                  const groupTeams = getTeamsInGroup(group.groupid);
                  
                  return (
                    <div key={group.groupid} className="group-card">
                      <div className="group-header">
                        <div className="group-title">
                          <h4>{group.groupname}</h4>
                          <div className="group-stats-summary">
                            <span className="stat-badge">{groupStats.teamsCount} teams</span>
                            <span className="stat-badge">{groupStats.totalMatches} matches</span>
                            <span className="stat-badge completed">{groupStats.completedMatches} finished</span>
                            <span className="stat-badge upcoming">{groupStats.upcomingMatches} upcoming</span>
                          </div>
                        </div>
                        <button 
                          className="action-btn"
                          onClick={() => {
                            setSelectedGroup(group);
                            setShowAssignTeamForm(true);
                          }}
                        >
                          Manage Teams
                        </button>
                      </div>
                      
                      <div className="group-content">
                        <div className="group-teams">
                          <h5>Teams ({groupTeams.length})</h5>
                          {groupTeams.length === 0 ? (
                            <p className="no-teams">No teams assigned</p>
                          ) : (
                            <div className="teams-list">
                              {groupTeams.map((team: any) => (
                                <div key={team.teamid} className="team-item">
                                  <span className="team-name">{team.teamname}</span>
                                  {team.logourl && (
                                    <img src={team.logourl} alt={team.teamname} className="team-logo-small" />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="group-standings">
                          <div className="standings-header">
                            <h5>Live Standings</h5>
                            <div className="standings-legend">
                              <span>P: Played</span>
                              <span>W: Wins</span>
                              <span>D: Draws</span>
                              <span>L: Losses</span>
                              <span>GF: Goals For</span>
                              <span>GA: Goals Against</span>
                              <span>GD: Goal Difference</span>
                              <span>Pts: Points</span>
                            </div>
                          </div>
                          
                          {groupStandings.length === 0 ? (
                            <div className="no-standings">
                              <p>No standings data available</p>
                              <small>Standings will appear automatically when match results are entered</small>
                            </div>
                          ) : (
                            <div className="standings-table-container">
                              <table className="standings-table">
                                <thead>
                                  <tr>
                                    <th className="position-col">#</th>
                                    <th className="team-col">Team</th>
                                    <th className="stat-col">P</th>
                                    <th className="stat-col">W</th>
                                    <th className="stat-col">D</th>
                                    <th className="stat-col">L</th>
                                    <th className="stat-col">GF</th>
                                    <th className="stat-col">GA</th>
                                    <th className="stat-col">GD</th>
                                    <th className="points-col">Pts</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {groupStandings.map((standing: any, index: number) => {
                                    const team = teams.find((t: any) => t.teamid === standing.teamid);
                                    const goalDifference = standing.goalsfor - standing.goalsagainst;
                                    const isTopThree = index < 3;
                                    
                                    return (
                                      <tr key={standing.teamid} className={isTopThree ? 'top-three' : ''}>
                                        <td className="position-col">
                                          <span className={`position ${index === 0 ? 'first' : index === 1 ? 'second' : index === 2 ? 'third' : ''}`}>
                                            {index + 1}
                                          </span>
                                        </td>
                                        <td className="team-col">
                                          <div className="team-info">
                                            {team?.logourl && (
                                              <img src={team.logourl} alt={team.teamname} className="team-logo" />
                                            )}
                                            <span className="team-name">{team?.teamname || 'Unknown'}</span>
                                          </div>
                                        </td>
                                        <td className="stat-col">{standing.matchesplayed}</td>
                                        <td className="stat-col wins">{standing.wins}</td>
                                        <td className="stat-col draws">{standing.draws}</td>
                                        <td className="stat-col losses">{standing.losses}</td>
                                        <td className="stat-col">{standing.goalsfor}</td>
                                        <td className="stat-col">{standing.goalsagainst}</td>
                                        <td className={`stat-col ${goalDifference > 0 ? 'positive' : goalDifference < 0 ? 'negative' : ''}`}>
                                          {goalDifference > 0 ? '+' : ''}{goalDifference}
                                        </td>
                                        <td className="points-col">
                                          <span className="points">{standing.points}</span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Group Form */}
      {showCreateGroupForm && (
        <CreateGroupForm 
          tournament={selectedTournament}
          onClose={() => setShowCreateGroupForm(false)}
          onSuccess={() => {
            setShowCreateGroupForm(false);
            loadTournamentData();
          }}
        />
      )}

      {/* Assign Team Form */}
      {showAssignTeamForm && (
        <AssignTeamForm 
          group={selectedGroup}
          availableTeams={getAvailableTeams()}
          assignedTeams={getTeamsInGroup(selectedGroup?.groupid)}
          onClose={() => setShowAssignTeamForm(false)}
          onSuccess={() => {
            setShowAssignTeamForm(false);
            loadTournamentData();
          }}
        />
      )}
    </div>
  );
};

// Create Group Form Component
const CreateGroupForm: React.FC<{
  tournament: any;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ tournament, onClose, onSuccess }) => {
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await api.createTournamentGroup({
        tournamentid: tournament.tournamentid,
        groupname: groupName.trim()
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Create Group</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tournament: {tournament.name}</label>
          </div>
          
          <div className="form-group">
            <label>Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Group A, Group B, etc."
              required
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="secondary-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="primary-btn">
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Assign Team Form Component
const AssignTeamForm: React.FC<{
  group: any;
  availableTeams: any[];
  assignedTeams: any[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ group, availableTeams, assignedTeams, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssignTeam = async (teamid: number) => {
    try {
      setLoading(true);
      setError(null);

      await api.createGroupTeam({
        groupid: group.groupid,
        teamid: teamid
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to assign team');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTeam = async (teamid: number) => {
    try {
      setLoading(true);
      setError(null);

      await api.deleteGroupTeam(group.groupid, teamid);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to remove team');
    } finally {
      setLoading(false);
    }
  };

  const unassignedTeams = availableTeams.filter(team => 
    !assignedTeams.some(assigned => assigned.teamid === team.teamid)
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content large-modal">
        <div className="modal-header">
          <h3>Manage Teams - {group.groupname}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="team-assignment">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="assigned-teams">
            <h4>Assigned Teams ({assignedTeams.length})</h4>
            {assignedTeams.length === 0 ? (
              <p>No teams assigned to this group</p>
            ) : (
              <div className="team-list">
                {assignedTeams.map((team: any) => (
                  <div key={team.teamid} className="team-item">
                    <span>{team.teamname}</span>
                    <button 
                      className="remove-btn"
                      onClick={() => handleRemoveTeam(team.teamid)}
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="available-teams">
            <h4>Available Teams ({unassignedTeams.length})</h4>
            {unassignedTeams.length === 0 ? (
              <p>All teams are already assigned to groups</p>
            ) : (
              <div className="team-list">
                {unassignedTeams.map((team: any) => (
                  <div key={team.teamid} className="team-item">
                    <span>{team.teamname}</span>
                    <button 
                      className="assign-btn"
                      onClick={() => handleAssignTeam(team.teamid)}
                      disabled={loading}
                    >
                      Assign
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button onClick={onClose} className="secondary-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// User Management Component
const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await api.listUsers();
      setUsers(usersData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner color="white" size="lg" />;
  }

  return (
    <div className="user-management">
      <div className="section-header">
        <h2>User Management</h2>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Join Date</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.userid}>
                <td>{user.firstname} {user.lastname}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.status.toLowerCase()}`}>
                    {user.status}
                  </span>
                </td>
                <td>{new Date(user.joindate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;

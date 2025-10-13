import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import Spinner from '../components/Spinner';
import { getPlayerImage } from '../utils/defaultImages';
import { formatFullName, capitalizeFirstLetter } from '../utils/nameUtils';
import './TeamManagement.css';

type User = {
  userid: number;
  email: string;
  firstname?: string;
  lastname?: string;
  role: string;
  status: string;
  teamid?: number;
  teamname?: string;
  profileimage?: string;
};

type Player = {
  playerid: number;
  userid?: number;
  teamid?: number;
  position?: string;
  jerseynumber?: number;
  firstname?: string;
  lastname?: string;
  email?: string;
  profileimage?: string;
  status?: string;
};

const TeamManagement: React.FC = () => {
  const { user } = useAuth();
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  console.log('TeamManagement component loaded, user:', user);

  // Check if current user is a team captain
  // For now, we'll allow Admins and users with teams to manage teams
  // In a real system, you'd check if user.userid === team.teamcaptainid
  const isCaptain = user?.role === 'Admin' || user?.teamid;
  
  console.log('isCaptain:', isCaptain, 'user.role:', user?.role, 'user.teamid:', user?.teamid);

  useEffect(() => {
    if (isCaptain && user?.teamid) {
      loadTeamPlayers();
    }
  }, [isCaptain, user?.teamid]);

  const loadTeamPlayers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const playersData = await api.listPlayers({ teamid: user?.teamid });
      setTeamPlayers(playersData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load team players');
    } finally {
      setLoading(false);
    }
  };

  const searchAvailablePlayers = async (query: string) => {
    if (!query.trim()) {
      setAvailableUsers([]);
      return;
    }

    setSearchLoading(true);
    setError(null);
    
    try {
      const usersData = await api.listUsers();
      
      // Filter out users who are already players or are in other teams
      const availableUsersList = (usersData || []).filter((u: any) => 
        u.role === 'Player' && 
        !u.teamid && 
        u.status === 'active' &&
        (u.firstname?.toLowerCase().includes(query.toLowerCase()) ||
         u.lastname?.toLowerCase().includes(query.toLowerCase()) ||
         u.email?.toLowerCase().includes(query.toLowerCase()))
      );
      
      setAvailableUsers(availableUsersList);
    } catch (err: any) {
      setError(err.message || 'Failed to search players');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddPlayer = async (userId: number) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // First, find the user's player record
      const allPlayers = await api.listPlayers();
      const userPlayer = allPlayers.find((p: Player) => p.userid === userId);
      
      if (!userPlayer) {
        setError('Player record not found. User needs to complete onboarding first.');
        return;
      }
      
      // Update the player's team
      await api.updatePlayer(userPlayer.playerid, {
        teamid: user?.teamid
      });
      
      setSuccess('Player added to team successfully!');
      loadTeamPlayers(); // Reload team players
    } catch (err: any) {
      setError(err.message || 'Failed to add player to team');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePlayer = async (playerId: number, userId: number) => {
    if (!confirm('Are you sure you want to remove this player from the team?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Update the player's team to null
      await api.updatePlayer(playerId, {
        teamid: null
      });
      
      setSuccess('Player removed from team successfully!');
      loadTeamPlayers(); // Reload team players
    } catch (err: any) {
      setError(err.message || 'Failed to remove player from team');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!user?.teamid) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // First, remove all players from the team
      for (const player of teamPlayers) {
        await api.updatePlayer(player.playerid, {
          teamid: null
        });
      }
      
      // Then delete the team
      await api.deleteTeam(user.teamid);
      
      setSuccess('Team deleted successfully!');
      setShowDeleteConfirm(false);
      
      // Redirect to home page after a short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete team');
    } finally {
      setLoading(false);
    }
  };


  if (!isCaptain) {
    return (
      <div className="team-management-container">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>Only team captains can manage team players.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="team-management-container">
      <div className="team-management-header">
        <h1>Manage Your Team</h1>
        <h2>{user?.teamname} - Add & Remove Players</h2>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {/* Delete Team Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Team</h3>
            <p>Are you sure you want to delete your team "{user?.teamname}"?</p>
            <p className="warning-text">This action cannot be undone. All players will be removed from the team.</p>
            <div className="modal-buttons">
              <button 
                className="cancel-btn"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="confirm-delete-btn"
                onClick={handleDeleteTeam}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Team'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="team-management-content">
        {/* Current Team Players */}
        <div className="section">
          <h3>Your Team Players ({teamPlayers.length})</h3>
          {loading ? (
            <div className="loading-state">
              <Spinner color="white" size="md" />
              <span>Loading team players...</span>
            </div>
          ) : teamPlayers.length > 0 ? (
            <div className="players-grid">
              {teamPlayers.map(player => (
                <div key={player.playerid} className="player-card">
                  <div className="player-info">
                    <div className="player-avatar">
                      <img 
                        src={getPlayerImage(player.profileimage)} 
                        alt={capitalizeFirstLetter(player.firstname) || 'Player'}
                      />
                    </div>
                    <div className="player-details">
                      <h4>{formatFullName(player.firstname, player.lastname)}</h4>
                      <p>{player.email}</p>
                      <p>Position: {player.position || 'Not set'}</p>
                      <p>Jersey: #{player.jerseynumber || 'Not set'}</p>
                    </div>
                  </div>
                  <button
                    className="remove-btn"
                    onClick={() => handleRemovePlayer(player.playerid, player.userid!)}
                    disabled={loading}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Your team is empty. Add players to get started!</p>
            </div>
          )}
        </div>

        {/* Available Players to Add */}
        <div className="section">
          <h3>Add New Players</h3>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search for a player to add..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchAvailablePlayers(e.target.value);
              }}
              className="search-input"
            />
          </div>
          
          {searchLoading ? (
            <div className="loading-state">
              <Spinner color="white" size="md" />
              <span>Searching players...</span>
            </div>
          ) : availableUsers.length > 0 ? (
            <div className="players-grid">
              {availableUsers.map(user => (
                <div key={user.userid} className="player-card available">
                  <div className="player-info">
                    <div className="player-avatar">
                      <img 
                        src={getPlayerImage(user.profileimage)} 
                        alt={capitalizeFirstLetter(user.firstname) || 'Player'}
                      />
                    </div>
                    <div className="player-details">
                      <h4>{formatFullName(user.firstname, user.lastname)}</h4>
                      <p>{user.email}</p>
                      <p>Status: {user.status}</p>
                    </div>
                  </div>
                  <button
                    className="add-btn"
                    onClick={() => handleAddPlayer(user.userid)}
                    disabled={loading}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No players found. Try searching with a different name or email.</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Team Button at Bottom */}
      <div className="delete-team-section">
        <button 
          className="delete-team-btn"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={loading}
        >
          Delete Team
        </button>
      </div>
    </div>
  );
};

export default TeamManagement;

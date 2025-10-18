import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import Spinner from '../components/Spinner';
import './Tournaments.css';

interface Tournament {
  tournamentid: number;
  name: string;
  seasonyear?: number;
  startdate?: string;
  enddate?: string;
  description?: string;
  isRegistered?: boolean;
}

const Tournaments: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState<number | null>(null);
  const [joinNote, setJoinNote] = useState<string>('');
  const [showJoinForm, setShowJoinForm] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if user is a team captain
  const isTeamCaptain = user?.isTeamCaptain === true && user?.teamid;

  useEffect(() => {
    loadTournaments();
    // Refresh user data to ensure we have the latest captain status
    if (isAuthenticated) {
      api.getCurrentUser().then(updatedUser => {
        // User data refreshed
      }).catch(err => {
        console.error('Failed to refresh user data:', err);
      });
    }
  }, [isAuthenticated]);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      const tournamentsData = await api.listTournaments();
      
      // Check registration status for each tournament if user has a team
      if (user?.teamid && tournamentsData) {
        const tournamentsWithStatus = await Promise.all(
          tournamentsData.map(async (tournament: any) => {
            try {
              const tournamentTeams = await api.getTournamentTeams(tournament.tournamentid);
              const isRegistered = tournamentTeams.registered_team_ids?.includes(user?.teamid) || false;
              return { ...tournament, isRegistered };
            } catch (err) {
              // If we can't check registration status, assume not registered
              return { ...tournament, isRegistered: false };
            }
          })
        );
        setTournaments(tournamentsWithStatus);
      } else {
        setTournaments(tournamentsData || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTournament = async (tournamentId: number) => {
    if (!isTeamCaptain) {
      setError('Only team captains can join tournaments');
      return;
    }

    try {
      setJoining(tournamentId);
      setError(null);
      setSuccessMessage(null);

      const result = await api.joinTournament({
        tournamentid: tournamentId,
        note: joinNote.trim() || undefined
      });

      setSuccessMessage(result.message || 'Successfully joined tournament!');
      setShowJoinForm(null);
      setJoinNote('');
      
      // Reload tournaments to update status
      await loadTournaments();
    } catch (err: any) {
      setError(err.message || 'Failed to join tournament');
    } finally {
      setJoining(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString();
  };

  if (!isAuthenticated) {
    return (
      <div className="TournamentsPage">
        <div className="tournaments-header">
          <h1>Tournaments</h1>
          <p>Please log in to view tournaments</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="TournamentsPage">
        <div className="tournaments-header">
          <h1>Tournaments</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: 'white' }}>
          <Spinner color="white" size="md" />
          <span style={{ marginLeft: '15px' }}>Loading tournaments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="TournamentsPage">
      <div className="tournaments-header">
        <h1>Available Tournaments</h1>
        {user?.teamid ? (
          <p>View tournament registration status for your team</p>
        ) : (
          <p>You need to be part of a team to participate in tournaments</p>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      <div className="tournaments-section">
        <div className="tournaments-grid">
          {tournaments.length === 0 ? (
            <div className="no-tournaments">
              <p>No tournaments available at the moment</p>
            </div>
          ) : (
            tournaments.map((tournament) => (
            <div key={tournament.tournamentid} className="tournament-card">
              <div className="tournament-header">
                <h3>{tournament.name}</h3>
                {tournament.seasonyear && (
                  <span className="season-year">{tournament.seasonyear}</span>
                )}
              </div>
              
              <div className="tournament-details">
                <div className="detail-row">
                  <span className="label">Start Date:</span>
                  <span className="value">{formatDate(tournament.startdate)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">End Date:</span>
                  <span className="value">{formatDate(tournament.enddate)}</span>
                </div>
                {tournament.description && (
                  <div className="description">
                    <p>{tournament.description}</p>
                  </div>
                )}
              </div>

              <div className="tournament-actions">
                {tournament.isRegistered ? (
                  <button className="btn-registered" disabled>
                    ✓ Registered
                  </button>
                ) : isTeamCaptain ? (
                  showJoinForm === tournament.tournamentid ? (
                    <div className="join-form">
                      <textarea
                        placeholder="Optional note for tournament organizers..."
                        value={joinNote}
                        onChange={(e) => setJoinNote(e.target.value)}
                        rows={3}
                        maxLength={500}
                      />
                      <div className="form-actions">
                        <button
                          className="btn-secondary"
                          onClick={() => {
                            setShowJoinForm(null);
                            setJoinNote('');
                          }}
                          disabled={joining === tournament.tournamentid}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn-primary"
                          onClick={() => handleJoinTournament(tournament.tournamentid)}
                          disabled={joining === tournament.tournamentid}
                        >
                          {joining === tournament.tournamentid ? (
                            <>
                              <Spinner color="white" size="sm" />
                              Joining...
                            </>
                          ) : (
                            'Join Tournament'
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="btn-primary"
                      onClick={() => setShowJoinForm(tournament.tournamentid)}
                    >
                      Register Team
                    </button>
                  )
                ) : user?.teamid ? (
                  <button className="btn-registered" disabled>
                    Not Registered
                  </button>
                ) : null}
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      {!isTeamCaptain && user?.teamid && (
        <div className="captain-notice">
          <p>Only team captains can register teams for tournaments. Contact your team captain to register for tournaments.</p>
        </div>
      )}

      {!user?.teamid && (
        <div className="no-team-notice">
          <p>You need to be part of a team to participate in tournaments.</p>
        </div>
      )}
    </div>
  );
};

export default Tournaments;

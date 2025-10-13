import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import './PlayerDetail.css';
import defaultPlayerPhoto from '../assets/defaultPlayer.png';
import defaultTeamLogo from '../assets/default_team.png';
import Spinner from '../components/Spinner';
import { formatFullName, capitalizeFirstLetter } from '../utils/nameUtils';

// Counter component for animated numbers
const Counter: React.FC<{ value: number; duration?: number }> = ({ value, duration = 2000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  return <span>{count}</span>;
};

type Player = {
  playerid: number;
  userid?: number | null;
  teamid?: number | null;
  position?: string | null;
  jerseynumber?: number | null;
  statsid?: number | null;
  preferredfoot?: string | null;
  height?: number | null;
  weight?: number | null;
  // May be present when coming from list endpoint
  firstname?: string | null;
  lastname?: string | null;
  email?: string | null;
  profileimage?: string | null;
  status?: string | null;
  teamname?: string | null;
  teamlogo?: string | null;
  // Player statistics
  matchesplayed?: number;
  goals?: number;
  assists?: number;
  yellowcards?: number;
  redcards?: number;
  mvpcount?: number;
  ratingaverage?: number;
};

const PlayerDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const playerId = useMemo(() => {
    const parsed = Number(id);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [id]);

  useEffect(() => {
    if (!playerId) return;

    let isMounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getPlayer(playerId);
        if (!isMounted) return;
        setPlayer(data);
      } catch (e) {
        if (!isMounted) return;
        setError('Failed to load player');
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [playerId]);

  const fullName = useMemo(() => {
    const formattedName = formatFullName(player?.firstname, player?.lastname);
    if (formattedName) return formattedName;
    return player ? `Player ${player.playerid}` : 'Player';
  }, [player?.firstname, player?.lastname, player?.playerid]);

  const avatar = useMemo(() => player?.profileimage || defaultPlayerPhoto, [player?.profileimage]);
  
  const teamLogo = useMemo(() => player?.teamlogo || defaultTeamLogo, [player?.teamlogo]);

  return (
    <div className="PlayersPage">
      <div className="players-title">PLAYER</div>

      <div className="players-section">
        <button className="page-btn" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>← Back</button>

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', color: 'white' }}>
            <Spinner color="white" size="sm" />
            <span style={{ marginLeft: 10 }}>Loading...</span>
          </div>
        )}

        {!loading && error && (
          <div className="empty" style={{ color: 'white' }}>{error}</div>
        )}

        {!loading && player && (
          <div className='card-container'>
            <div className="stats-card">
              <div className='data-wrapper'>
                <div className='avatar-line'>
                  <div className='bg-logo'>
                    <img src={teamLogo} alt={player.teamname || 'Team'} loading="lazy" />
                  </div>
                  <img className='player-pic' src={avatar} alt={fullName} loading="lazy" />
                </div>
                <div className='main-data'>
                  <div className='name'>
                    <h1>{capitalizeFirstLetter(player.firstname) || 'First Name'}</h1>
                    <h3>{capitalizeFirstLetter(player.lastname) || 'Last Name'}</h3>
                  </div>
                  <div className='ovals'>
                    <div className='oval-one'>{player.position || 'No Position'}</div>
                    <div className='oval-two'>{player.status || 'No Status'}</div>
                  </div>
                  <div className='team'>
                    <div className='team-logo-detail'>
                      <img src={teamLogo} alt={player.teamname || 'Team'} loading="lazy" />
                    </div>
                    <div className='team-name-detail'>{player.teamname || 'No Team'}</div>
                  </div>
                </div>
                <div className='personal-info'>
                  <div className='personal-info-grid'>
                    <div className='info-item'>
                      <div className='info-label'>Position</div>
                      <div className='info-value'>{player.position || 'Not Set'}</div>
                    </div>
                    <div className='info-item'>
                      <div className='info-label'>Height</div>
                      <div className='info-value'>{player.height ? `${player.height}cm` : 'Not Set'}</div>
                    </div>
                    <div className='info-item'>
                      <div className='info-label'>Weight</div>
                      <div className='info-value'>{player.weight ? `${player.weight}kg` : 'Not Set'}</div>
                    </div>
                    <div className='info-item'>
                      <div className='info-label'>Preferred Foot</div>
                      <div className='info-value'>{player.preferredfoot || 'Not Set'}</div>
                    </div>
                    <div className='info-item'>
                      <div className='info-label'>Jersey Number</div>
                      <div className='info-value'>{player.jerseynumber || 'Not Set'}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className='info-card'>
                  <div className='stat-item'>
                    <div className='stat-value'>
                      <Counter value={player.matchesplayed || 0} duration={1500} />
                    </div>
                    <div className='stat-label'>Matches</div>
                  </div>
                  <div className='stat-item'>
                    <div className='stat-value'>
                      <Counter value={player.goals || 0} duration={1200} />
                    </div>
                    <div className='stat-label'>Goals</div>
                  </div>
                    <div className='stat-item'>
                      <div className='stat-value'>
                        <Counter value={player.mvpcount || 0} duration={1000} />
                      </div>
                      <div className='stat-label'>MVP</div>
                    </div>
                    <div className='stat-item'>
                      <div className='stat-value'>
                        <Counter value={player.yellowcards || 0} duration={800} />
                      </div>
                      <div className='stat-label'>Yellow</div>
                    </div>
                    <div className='stat-item'>
                      <div className='stat-value'>
                        <Counter value={player.redcards || 0} duration={600} />
                      </div>
                      <div className='stat-label'>Red</div>
                    </div>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerDetail;



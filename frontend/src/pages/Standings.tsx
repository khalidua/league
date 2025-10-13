import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import './Standings.css';
import StandingsTable, { type StandingsTeam } from '../components/StandingsTable';
import { api } from '../api/client';
import Spinner from '../components/Spinner';
import defaultTeamLogo from '../assets/default_team.png';

type StandingsData = {
  standingid: number;
  groupid?: number;
  teamid?: number;
  matchesplayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsfor: number;
  goalsagainst: number;
  goaldifference?: number;
  points: number;
  teamname?: string;
  teamlogo?: string;
  groupname?: string;
};

const StandingsPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const initialGroup = params.get('group') ?? 'Group A';
  const [active, setActive] = useState<string>(initialGroup);
  const [standingsData, setStandingsData] = useState<StandingsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch standings data
  useEffect(() => {
    const fetchStandings = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.listStandings();
        setStandingsData(data);
      } catch (e) {
        setError('Failed to load standings');
        console.error('Error fetching standings:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, []);

  // Group standings by group name
  const groups = useMemo(() => {
    const groupedData = standingsData.reduce((acc, standing) => {
      const groupName = standing.groupname || 'Unassigned';
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      
      // Convert to StandingsTeam format
      const teamData: StandingsTeam = {
        id: standing.standingid,
        name: standing.teamname || `Team ${standing.teamid}`,
        logoUrl: standing.teamlogo || defaultTeamLogo,
        played: standing.matchesplayed,
        wins: standing.wins,
        draws: standing.draws,
        losses: standing.losses,
        goalsFor: standing.goalsfor,
        goalsAgainst: standing.goalsagainst,
        goalDifference: standing.goaldifference || 0,
        points: standing.points,
        form: 'N/A' // We'll implement form calculation later
      };
      
      acc[groupName].push(teamData);
      return acc;
    }, {} as Record<string, StandingsTeam[]>);

    // Convert to array format and sort teams within each group
    return Object.entries(groupedData).map(([key, teams]) => ({
      key,
      teams: teams.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      })
    }));
  }, [standingsData]);

  const current = groups.find(g => g.key === active) ?? groups[0];

  const setGroup = (g: string) => {
    setActive(g);
    const next = new URLSearchParams(params);
    next.set('group', g);
    setParams(next, { replace: true });
  };

  return (
    <div className="StandingsPage">
      <div className="standings-strap">LEAGUE STANDINGS</div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: 'white' }}>
          <Spinner color="white" size="md" />
          <span style={{ marginLeft: '15px' }}>Loading standings...</span>
        </div>
      )}

      {!loading && error && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'white' }}>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              marginTop: '10px', 
              padding: '8px 16px', 
              backgroundColor: '#1E93AB', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && groups.length > 0 && (
        <>
          <div className="standings-tabs">
            {groups.map(g => (
              <button
                key={g.key}
                className={`tab-btn${g.key === active ? ' is-active' : ''}`}
                onClick={() => setGroup(g.key)}
                type="button"
              >
                {g.key}
              </button>
            ))}
          </div>

          <div className="standings-section">
            <StandingsTable title={current.key} teams={current.teams} showForm />
          </div>
        </>
      )}

      {!loading && !error && groups.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'white' }}>
          <p>No standings data available</p>
        </div>
      )}

      <div className="standings-footer">
        <Link to="/" className="standings-home">Back to Home</Link>
      </div>
    </div>
  );
};

export default StandingsPage;



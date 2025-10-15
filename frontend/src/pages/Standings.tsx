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
        const [standings, results, matches, teams, groupTeams] = await Promise.all([
          api.listStandings(),
          api.listMatchResults(),
          api.listMatches(),
          api.listTeams(),
          api.listGroupTeams(),
        ]);
        // Attach auxiliary data for form calculation
        const matchById: Record<number, any> = {};
        (matches || []).forEach((m: any) => { matchById[Number(m.matchid)] = m; });
        const teamById: Record<number, any> = {};
        (teams || []).forEach((t: any) => { teamById[Number(t.teamid)] = t; });
        // Build group -> teamId set
        const groupIdToTeamIds: Record<number, Set<number>> = {};
        (groupTeams || []).forEach((gt: any) => {
          const gid = Number(gt.groupid);
          const tid = Number(gt.teamid);
          if (!groupIdToTeamIds[gid]) groupIdToTeamIds[gid] = new Set<number>();
          groupIdToTeamIds[gid].add(tid);
        });

        // Map into enriched records keeping original properties
        const enriched = (standings || []).map((s: any) => ({ ...s, _results: results, _matchById: matchById, _teamById: teamById, _groupTeamIds: groupIdToTeamIds[Number(s.groupid)] }));
        setStandingsData(enriched);
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
      const matchesById = (standing as any)._matchById as Record<number, any>;
      const allResults = (standing as any)._results as any[];
      const groupTeamIds = (standing as any)._groupTeamIds as Set<number> | undefined;
      const teamIdNum = Number(standing.teamid);
      const teamResults = (allResults || [])
        .filter((r: any) => {
          const m = matchesById[Number(r.matchid)];
          if (!m) return false;
          // require finished matches only and within same group (both teams in group)
          if (m.status !== 'Finished') return false;
          if (groupTeamIds) {
            const inSameGroup = groupTeamIds.has(Number(m.hometeamid)) && groupTeamIds.has(Number(m.awayteamid));
            if (!inSameGroup) return false;
          }
          return Number(m.hometeamid) === teamIdNum || Number(m.awayteamid) === teamIdNum;
        })
        .sort((ra: any, rb: any) => {
          const ma = matchesById[Number(ra.matchid)];
          const mb = matchesById[Number(rb.matchid)];
          const da = ma ? new Date(ma.matchdate).getTime() : 0;
          const db = mb ? new Date(mb.matchdate).getTime() : 0;
          return db - da; // newest first
        })
        .slice(0, Math.min(5, standing.matchesplayed || 5));
      const formStr = teamResults.map((r: any) => {
        if (r.winnerteamid == null) return 'D';
        return Number(r.winnerteamid) === teamIdNum ? 'W' : 'L';
      }).join('-');

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
        form: formStr
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



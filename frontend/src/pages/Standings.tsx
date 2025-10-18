import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './Standings.css';
import StandingsTable, { type StandingsTeam } from '../components/StandingsTable';
import { api } from '../api/client';
import Spinner from '../components/Spinner';

const StandingsPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const initialGroup = params.get('group') ?? '';
  const [groups, setGroups] = useState<{ title: string; teams: StandingsTeam[] }[]>([]);
  const [activeGroup, setActiveGroup] = useState<string>(initialGroup);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStandings = async () => {
      try {
        setLoading(true);
        setError(null);
        const [groupsData, standingsData, teamsData, resultsData, matchesData] = await Promise.all([
          api.listTournamentGroups(),
          api.listStandings(),
          api.listTeams(),
          api.listMatchResults(),
          api.listMatches(),
        ]);

        const teamById: Record<number, any> = {};
        (teamsData || []).forEach((t: any) => { teamById[Number(t.teamid)] = t; });

        // index matches by id for quick lookup (date and teams)
        const matchById: Record<number, any> = {};
        (matchesData || []).forEach((m: any) => { matchById[Number(m.matchid)] = m; });

        console.log('Raw groupsData:', groupsData);
        
        const groupsTop: { title: string; teams: StandingsTeam[] }[] = (groupsData || [])
          .filter((g: any, index: number, self: any[]) => 
            self.findIndex(group => group.groupid === g.groupid) === index
          )
          .map((g: any) => {
          const groupStandings = (standingsData || []).filter((s: any) => s.groupid === g.groupid);
          const sorted = groupStandings.sort((a: any, b: any) => {
            if (b.points !== a.points) return b.points - a.points;
            const gdA = (a.goalsfor || 0) - (a.goalsagainst || 0);
            const gdB = (b.goalsfor || 0) - (b.goalsagainst || 0);
            if (gdB !== gdA) return gdB - gdA;
            return (b.goalsfor || 0) - (a.goalsfor || 0);
          });

          const teams: StandingsTeam[] = sorted.map((s: any) => {
            const team = teamById[Number(s.teamid)] || {};
            const played = (s.wins || 0) + (s.draws || 0) + (s.losses || 0);
            // compute recent form from latest 5 results involving this team
            const teamResults = (resultsData || [])
              .filter((r: any) => {
                const m = matchById[Number(r.matchid)];
                if (!m) return false;
                return Number(m.hometeamid) === Number(s.teamid) || Number(m.awayteamid) === Number(s.teamid);
              })
              .sort((ra: any, rb: any) => {
                const ma = matchById[Number(ra.matchid)];
                const mb = matchById[Number(rb.matchid)];
                const da = ma ? new Date(ma.matchdate).getTime() : 0;
                const db = mb ? new Date(mb.matchdate).getTime() : 0;
                return db - da; // newest first
              })
              .slice(0, 5);

            const formStr = teamResults.length > 0 
              ? teamResults.map((r: any) => {
                  if (r.winnerteamid == null) return 'D';
                  return Number(r.winnerteamid) === Number(s.teamid) ? 'W' : 'L';
                }).join('-')
              : 'W-W-D-L'; // Test form for debugging
            
            console.log(`Team ${s.teamid} form:`, formStr);
            console.log(`Team ${s.teamid} teamResults:`, teamResults);
            console.log(`Team ${s.teamid} teamResults.length:`, teamResults.length);
            console.log(`Team ${s.teamid} form string length:`, formStr.length);
            
            return {
              id: s.teamid,
              name: team.teamname || `Team ${s.teamid}`,
              logoUrl: team.logourl || '/src/assets/default_team.png',
              played,
              wins: s.wins || 0,
              draws: s.draws || 0,
              losses: s.losses || 0,
              goalsFor: s.goalsfor || 0,
              goalsAgainst: s.goalsagainst || 0,
              goalDifference: (s.goalsfor || 0) - (s.goalsagainst || 0),
              points: s.points || 0,
              form: formStr,
            } as StandingsTeam;
          });

          return { title: g.groupname || `Group ${g.groupid}`, teams };
        });

        console.log('Processed groupsTop:', groupsTop);
        
        // Additional deduplication by title to ensure no duplicates
        const uniqueGroups = groupsTop.filter((group, index, self) => 
          self.findIndex(g => g.title === group.title) === index
        );
        
        console.log('Unique groups:', uniqueGroups);
        setGroups(uniqueGroups);
        
        // Set initial active group if not set
        if (!activeGroup && uniqueGroups.length > 0) {
          const firstGroup = uniqueGroups[0].title;
          setActiveGroup(firstGroup);
          // Update URL with first group
          const next = new URLSearchParams(params);
          next.set('group', firstGroup);
          setParams(next, { replace: true });
        }
      } catch (e) {
        console.error('Error loading standings:', e);
        setError('Failed to load standings');
      } finally {
        setLoading(false);
      }
    };

    loadStandings();
  }, []);

  const setGroup = (groupTitle: string) => {
    setActiveGroup(groupTitle);
    const next = new URLSearchParams(params);
    next.set('group', groupTitle);
    setParams(next, { replace: true });
  };

  const currentGroup = groups.find(g => g.title === activeGroup) ?? groups[0];

  if (loading) {
    return (
      <div className="StandingsPage">
        <div className="standings-strap">LEAGUE STANDINGS</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: 'white' }}>
          <Spinner color="white" size="md" />
          <span style={{ marginLeft: '15px' }}>Loading standings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="StandingsPage">
        <div className="standings-strap">LEAGUE STANDINGS</div>
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
      </div>
    );
  }

  return (
    <div className="StandingsPage">
      <div className="standings-strap">LEAGUE STANDINGS</div>
      
      {groups.length > 0 && (
        <>
          <div className="standings-tabs">
            {groups.map(g => (
              <button
                key={g.title}
                className={`tab-btn${g.title === activeGroup ? ' is-active' : ''}`}
                onClick={() => setGroup(g.title)}
                type="button"
              >
                {g.title}
              </button>
            ))}
          </div>

          <div className="standings-section">
            {currentGroup && (
              <StandingsTable 
                title={currentGroup.title} 
                teams={currentGroup.teams} 
                showForm 
              />
            )}
          </div>
        </>
      )}

      <div className="standings-footer">
        <Link to="/" className="standings-home">Back to Home</Link>
      </div>
    </div>
  );
};

export default StandingsPage;
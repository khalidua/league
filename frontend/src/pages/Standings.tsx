import React, { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import './Standings.css';
import StandingsTable, { type StandingsTeam } from '../components/StandingsTable';
import crisLogo from '../assets/cris.png';
import realLogo from '../assets/realLogo.png';
import manLogo from '../assets/manLogo.png';
import reactLogo from '../assets/react.svg';

const StandingsPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const initialGroup = params.get('group') ?? 'Group A';
  const [active, setActive] = useState<string>(initialGroup);

  const groupA: StandingsTeam[] = [
    { id: 1, name: 'CRIS FC', logoUrl: crisLogo, played: 10, wins: 7, draws: 2, losses: 1, goalsFor: 20, goalsAgainst: 9, goalDifference: 11, points: 23, form: 'W-W-D-W-W' },
    { id: 2, name: 'React United', logoUrl: reactLogo, played: 10, wins: 6, draws: 3, losses: 1, goalsFor: 18, goalsAgainst: 8, goalDifference: 10, points: 21, form: 'W-D-W-W-D' },
    { id: 3, name: 'Vite City', logoUrl: reactLogo, played: 10, wins: 5, draws: 3, losses: 2, goalsFor: 15, goalsAgainst: 10, goalDifference: 5, points: 18, form: 'D-W-L-W-D' },
  ];

  const groupB: StandingsTeam[] = [
    { id: 'b1', name: 'Man Devs', logoUrl: manLogo, played: 10, wins: 6, draws: 2, losses: 2, goalsFor: 17, goalsAgainst: 9, goalDifference: 8, points: 20, form: 'W-W-D-L-W' },
    { id: 'b2', name: 'Real Coders', logoUrl: realLogo, played: 10, wins: 6, draws: 1, losses: 3, goalsFor: 16, goalsAgainst: 12, goalDifference: 4, points: 19, form: 'W-L-W-W-L' },
    { id: 'b3', name: 'Vite City', logoUrl: reactLogo, played: 10, wins: 5, draws: 3, losses: 2, goalsFor: 14, goalsAgainst: 11, goalDifference: 3, points: 18, form: 'D-W-W-L-D' },
  ];

  const groups = useMemo(() => (
    [
      { key: 'Group A', teams: groupA },
      { key: 'Group B', teams: groupB },
    ]
  ), []);

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

      <div className="standings-footer">
        <Link to="/" className="standings-home">Back to Home</Link>
      </div>
    </div>
  );
};

export default StandingsPage;



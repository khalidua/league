import React, { useMemo, useState } from 'react';
import './Teams.css';
import crisLogo from '../assets/cris.png';
import realLogo from '../assets/realLogo.png';
import manLogo from '../assets/manLogo.png';
import reactLogo from '../assets/react.svg';

type Team = {
  id: string | number;
  name: string;
  logoUrl: string;
  group?: string;
};

const demoTeams: Team[] = [
  { id: 1, name: 'CRIS FC', logoUrl: crisLogo, group: 'Group A' },
  { id: 2, name: 'React United', logoUrl: reactLogo, group: 'Group A' },
  { id: 3, name: 'Vite City', logoUrl: reactLogo, group: 'Group A' },
  { id: 4, name: 'TypeScript Town', logoUrl: reactLogo, group: 'Group A' },
  { id: 5, name: 'Real Coders', logoUrl: realLogo, group: 'Group B' },
  { id: 6, name: 'Man Devs', logoUrl: manLogo, group: 'Group B' },
  { id: 7, name: 'Node Ninjas', logoUrl: manLogo, group: 'Group B' },
  { id: 8, name: 'Express Eagles', logoUrl: realLogo, group: 'Group B' },
  { id: 9, name: 'Redux Rangers', logoUrl: reactLogo, group: 'Group A' },
  { id: 10, name: 'Hooked FC', logoUrl: reactLogo, group: 'Group A' },
  { id: 11, name: 'JS Giants', logoUrl: manLogo, group: 'Group B' },
  { id: 12, name: 'Async Athletes', logoUrl: realLogo, group: 'Group B' },
];

const Teams: React.FC = () => {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<string>('All');
  const [openGroup, setOpenGroup] = useState(false);
  const groups = useMemo(() => ['All', 'Group A', 'Group B'], []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return demoTeams.filter(t => {
      if (group !== 'All' && t.group !== group) return false;
      if (!q) return true;
      return t.name.toLowerCase().includes(q);
    });
  }, [query, group]);

  return (
    <div className="TeamsPage">
      <div className="teams-strap">TEAMS</div>

      <div className="teams-section">
        <div className="teams-header">
          <div className="filters">
            <div className="filter-group">
              <label className="filter-label" htmlFor="teams-search">Search</label>
              <input
                id="teams-search"
                className="search-input"
                type="text"
                placeholder="Team name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label className="filter-label" htmlFor="teams-group">Group</label>
              <div className="filter-dropdown">
                <button
                  id="teams-group"
                  type="button"
                  className="filter-btn"
                  aria-haspopup="listbox"
                  aria-expanded={openGroup}
                  onClick={() => setOpenGroup(v => !v)}
                >
                  {group}
                  <span className="chevron">▾</span>
                </button>
                {openGroup ? (
                  <div className="filter-menu" role="listbox" aria-label="Filter teams by group">
                    {groups.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        role="option"
                        aria-selected={group === opt}
                        className={`filter-item${group === opt ? ' is-active' : ''}`}
                        onClick={() => { setGroup(opt); setOpenGroup(false); }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="teams-grid">
          {filtered.map(t => (
            <div key={t.id} className="team-card">
              <img className="team-logo" src={t.logoUrl} alt={`${t.name} logo`} />
              <div className="team-name">{t.name}</div>
              {t.group ? <div className="team-meta">{t.group}</div> : null}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty">No teams found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Teams;



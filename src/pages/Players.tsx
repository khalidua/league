import React, { useEffect, useMemo, useRef, useState } from 'react';
import './Players.css';

type Player = {
  id: number;
  name: string;
  team: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  number: number;
  age: number;
  avatarUrl?: string;
};

type PlayersApiResponse = {
  data: Player[];
  total: number;
  teams?: string[];
};

// ---- Client-side mock: 20 players ----
const mockTeams = ['CRIS FC', 'React United', 'Vite City', 'ZC Legends'];
const mockPositions: Array<Player['position']> = ['GK', 'DEF', 'MID', 'FWD'];
const mockPlayers: Player[] = Array.from({ length: 20 }).map((_, idx) => {
  const id = idx + 1;
  const team = mockTeams[idx % mockTeams.length];
  const position = mockPositions[idx % mockPositions.length];
  const number = ((idx * 3) % 99) + 1;
  const age = 18 + ((idx * 2) % 15);
  // Simple demo avatars using react logo; replace with real URLs in production
  const avatarUrl = '/vite.svg';
  return {
    id,
    name: `Player ${id}`,
    team,
    position,
    number,
    age,
    avatarUrl
  } as Player;
});

function mockFetchPlayers(params: { page: number; limit: number; q?: string; team?: string; position?: string; }): Promise<PlayersApiResponse> {
  const { page, limit, q, team, position } = params;
  const query = (q || '').trim().toLowerCase();
  let list = mockPlayers.filter(p => {
    const matchesQuery = !query ||
      p.name.toLowerCase().includes(query) ||
      p.team.toLowerCase().includes(query) ||
      String(p.number).includes(query) ||
      p.position.toLowerCase().includes(query);
    const matchesTeam = !team || team === 'All' || p.team === team;
    const matchesPosition = !position || position === 'All' || p.position === position;
    return matchesQuery && matchesTeam && matchesPosition;
  });
  const total = list.length;
  const start = (page - 1) * limit;
  const data = list.slice(start, start + limit);
  const teams = Array.from(new Set(mockPlayers.map(p => p.team)));
  return Promise.resolve({ data, total, teams });
}

const Players: React.FC = () => {
  const [query, setQuery] = useState('');
  const [team, setTeam] = useState<string>('All');
  const [position, setPosition] = useState<string>('All');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [players, setPlayers] = useState<Player[]>([]);
  const [total, setTotal] = useState(0);
  const [teams, setTeams] = useState<string[]>(['All']);
  const positions = useMemo(() => ['All', 'GK', 'DEF', 'MID', 'FWD'], []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Client-side simulation of paginated players (10 per page)
        const json = await mockFetchPlayers({
          page,
          limit: pageSize,
          q: query.trim() || undefined,
          team: team !== 'All' ? team : undefined,
          position: position !== 'All' ? position : undefined,
        });
        setPlayers(json.data);
        setTotal(json.total);
        if (json.teams && json.teams.length > 0) setTeams(['All', ...json.teams]);
      } catch (e: any) {
        if (e.name === 'AbortError') return;
        setError('Failed to load players');
        setPlayers([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [page, pageSize, query, team, position]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <>
      <div className="PlayersPage">
        <div className="players-title">PLAYERS</div>

        <div className="players-section">
          <div className="players-header">
            <div className="filters">
              <div className="filter-group">
                <label className="filter-label" htmlFor="players-search">Search</label>
                <input
                  id="players-search"
                  className="search-input"
                  type="text"
                  placeholder="Name, team, number, position..."
                  value={query}
                  onChange={(e) => { setPage(1); setQuery(e.target.value); }}
                />
              </div>
              <div className="filter-group">
                <FilterDropdown
                  label="Team"
                  value={team}
                  options={teams}
                  onChange={(v) => { setPage(1); setTeam(v); }}
                  ariaLabel="Filter by team"
                />
              </div>
              <div className="filter-group">
                <FilterDropdown
                  label="Position"
                  value={position}
                  options={positions}
                  onChange={(v) => { setPage(1); setPosition(v); }}
                  ariaLabel="Filter by position"
                />
              </div>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="players-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Team</th>
                  <th>Position</th>
                  <th>Age</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="empty">Loading...</td>
                  </tr>
                )}
                {!loading && players.map(p => (
                  <tr key={p.id}>
                    <td>{p.number}</td>
                  <td>
                    <div className="player-cell">
                      {p.avatarUrl ? (
                        <img
                          className="player-avatar"
                          src={p.avatarUrl}
                          alt={`${p.name} avatar`}
                          width={36}
                          height={36}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="player-avatar placeholder" aria-hidden="true" />
                      )}
                      <span className="player-name">{p.name}</span>
                    </div>
                  </td>
                    <td>{p.team}</td>
                    <td>{p.position}</td>
                    <td>{p.age}</td>
                  </tr>
                ))}
                {!loading && players.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty">{error || 'No matching players'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button className="page-btn" disabled={!canPrev} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
            <span className="page-info">Page {page} of {totalPages}</span>
            <button className="page-btn" disabled={!canNext} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Players;



type FilterDropdownProps = {
  label?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  ariaLabel?: string;
};

const FilterDropdown: React.FC<FilterDropdownProps> = ({ label, value, options, onChange, ariaLabel }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div className="filter-dropdown" ref={ref} aria-label={ariaLabel}>
      {label && <div className="filter-label">{label}</div>}
      <button className="filter-btn" type="button" onClick={() => setOpen(v => !v)}>
        {value}
        <span className="chevron" aria-hidden>▾</span>
      </button>
      {open && (
        <div className="filter-menu">
          {options.map(opt => (
            <button
              key={opt}
              className={`filter-item${opt === value ? ' is-active' : ''}`}
              onClick={() => { onChange(opt); setOpen(false); }}
              type="button"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

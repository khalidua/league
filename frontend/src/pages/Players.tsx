import React, { useEffect, useMemo, useRef, useState } from 'react';
import './Players.css';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import Spinner from '../components/Spinner';
import defaultPlayerPhoto from '../assets/defaultPlayer.png';

type PlayerRow = {
	id: number;
	name: string;
	team: string;
	position: 'GK' | 'DEF' | 'MID' | 'FWD' | string;
	number: number;
	age?: number;
	avatarUrl?: string;
	firstname?: string;
	lastname?: string;
	email?: string;
	profileimage?: string;
};

const Players: React.FC = () => {
	const navigate = useNavigate();
	const goToPlayer = (p: PlayerRow) => {
		navigate(`/players/${p.id}`, { state: { id: p.id, name: p.name, team: p.team, position: p.position, age: p.age, number: p.number } });
	};
	const [query, setQuery] = useState('');
	const [team, setTeam] = useState<string>('All');
	const [position, setPosition] = useState<string>('All');
	const [page, setPage] = useState(1);
	const pageSize = 10;
	const [players, setPlayers] = useState<PlayerRow[]>([]);
	const [total, setTotal] = useState(0);
	const [teams, setTeams] = useState<string[]>(['All']);
	const positions = useMemo(() => ['All', 'GK', 'DEF', 'MID', 'FWD'], []);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const controller = new AbortController();
		(async () => {
			setLoading(true);
			setError(null);
			try {
				// Fetch players and map to UI rows. Backend now includes player names.
				const raw = await api.listPlayers();
				const mapped: PlayerRow[] = (raw || []).map((p: any) => {
					// Create full name from firstname and lastname, fallback to Player ID
					const fullName = (() => {
						if (p.firstname && p.lastname) {
							return `${p.firstname} ${p.lastname}`;
						} else if (p.firstname) {
							return p.firstname;
						} else if (p.lastname) {
							return p.lastname;
						} else {
							return `Player ${p.playerid}`;
						}
					})();
					
					return {
						id: p.playerid,
						name: fullName,
						team: typeof p.teamid === 'number' ? `Team ${p.teamid}` : '—',
						position: p.position || 'MID',
						number: p.jerseynumber || p.playerid,
						age: undefined,
						avatarUrl: p.profileimage || defaultPlayerPhoto,
						firstname: p.firstname,
						lastname: p.lastname,
						email: p.email,
						profileimage: p.profileimage,
					};
				});
				const q = (query || '').trim().toLowerCase();
				let list = mapped.filter((p) => {
					const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q) || String(p.number).includes(q) || String(p.position).toLowerCase().includes(q);
					const matchesTeam = !team || team === 'All' || p.team === team;
					const matchesPosition = !position || position === 'All' || p.position === position;
					return matchesQuery && matchesTeam && matchesPosition;
				});
				const total = list.length;
				const start = (page - 1) * pageSize;
				const data = list.slice(start, start + pageSize);
				const teams = Array.from(new Set(mapped.map((p) => p.team))).filter(Boolean);
				setPlayers(data);
				setTotal(total);
				if (teams && teams.length > 0) setTeams(['All', ...teams]);
			} catch (e: any) {
				if (e.name === 'AbortError') return;
				setError('Failed to load players');
				setPlayers([]);
				setTotal(0);
			} finally {
				setLoading(false);
			}
		})();
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
										<td colSpan={5} className="empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
											<Spinner color="white" size="sm" />
											<span style={{ marginLeft: '10px' }}>Loading...</span>
										</td>
									</tr>
								)}
								{!loading && players.map(p => (
									<tr key={p.id}>
										<td onClick={() => goToPlayer(p)} style={{ cursor: 'pointer' }}>{p.number}</td>
										<td onClick={() => goToPlayer(p)} style={{ cursor: 'pointer' }}>
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
												<Link
													className="player-name"
													to={`/players/${p.id}`}
													state={{ id: p.id, name: p.name, team: p.team, position: p.position, age: p.age, number: p.number }}
													onClick={(e) => e.stopPropagation()}
												>
													{p.name}
												</Link>
											</div>
										</td>
										<td onClick={() => goToPlayer(p)} style={{ cursor: 'pointer' }}>{p.team}</td>
										<td onClick={() => goToPlayer(p)} style={{ cursor: 'pointer' }}>{p.position}</td>
										<td onClick={() => goToPlayer(p)} style={{ cursor: 'pointer' }}>{p.age ?? '—'}</td>
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
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Teams.css';
import { api } from '../api/client';
import defaultTeamLogo from '../assets/default_team.png';
import Spinner from '../components/Spinner';

type Team = {
	id: string | number;
	name: string;
	logoUrl?: string;
	group?: string;
};

const Teams: React.FC = () => {
	const { user, isAuthenticated } = useAuth();
	const [query, setQuery] = useState('');
	const [group, setGroup] = useState<string>('All');
	const [openGroup, setOpenGroup] = useState(false);
	const groups = useMemo(() => ['All', 'Group A', 'Group B'], []);
	const [teams, setTeams] = useState<Team[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;
		(async () => {
			setLoading(true);
			setError(null);
			try {
				const raw = await api.listTeams();
				if (!active) return;
				const mapped: Team[] = (raw || []).map((t: any) => ({
					id: t.teamid,
					name: t.teamname,
					logoUrl: t.logourl || defaultTeamLogo,
					group: t.teamid % 2 === 0 ? 'Group B' : 'Group A',
				}));
				setTeams(mapped);
			} catch (e: any) {
				if (!active) return;
				setError('Failed to load teams');
				setTeams([]);
			} finally {
				if (active) setLoading(false);
			}
		})();
		return () => { active = false; };
	}, []);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return teams.filter(t => {
			if (group !== 'All' && t.group !== group) return false;
			if (!q) return true;
			return t.name.toLowerCase().includes(q);
		});
	}, [teams, query, group]);

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
					{loading && (
						<div className="empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
							<Spinner color="white" size="md" />
							<span style={{ marginLeft: '10px' }}>Loading...</span>
						</div>
					)}
				{!loading && filtered.map(t => (
					<div key={t.id} className="team-card-link" style={{ textDecoration: 'none' }}>
						<div className="team-card">
							<Link to={`/teams/${t.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
								<img className="team-logo" src={t.logoUrl || '/vite.svg'} alt={`${t.name} logo`} />
								<div className="team-name">{t.name}</div>
								{t.group ? <div className="team-meta">{t.group}</div> : null}
							</Link>
							{isAuthenticated && !user?.teamid ? (
								<button
									type="button"
									className="join-team-btn"
									onClick={async () => {
										try {
											await api.createJoinRequest(Number(t.id));
											alert('Join request sent to the team captain.');
										} catch (e: any) {
											alert(e.message || 'Failed to send join request');
										}
									}}
								>
									Request to Join
								</button>
							) : null}
						</div>
					</div>
				))}
					{!loading && filtered.length === 0 && (
						<div className="empty">{error || 'No teams found.'}</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default Teams;



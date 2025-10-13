import React, { useEffect, useMemo, useState } from 'react';
import './Matches.css';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/Spinner';
import defaultTeamLogo from '../assets/default_team.png';

type Team = {
	id: number;
	name: string;
	logoUrl?: string;
};

type Match = {
	matchid: number;
	tournamentid?: number;
	hometeamid?: number;
	awayteamid?: number;
	stadiumid?: number;
	matchdate: string;
	round: string;
	status: string;
};

type MatchWithTeams = Match & {
	hometeam?: Team;
	awayteam?: Team;
};

const Matches: React.FC = () => {
	const { user } = useAuth();
	const [query, setQuery] = useState('');
	const [selectedDate, setSelectedDate] = useState<string>('');
	const [myOnly, setMyOnly] = useState(false);
	const [matches, setMatches] = useState<MatchWithTeams[]>([]);
	const [teams, setTeams] = useState<Team[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;
		(async () => {
			setLoading(true);
			setError(null);
			try {
				// Fetch both matches and teams data
				const [matchesData, teamsData] = await Promise.all([
					api.listMatches(),
					api.listTeams()
				]);
				
				if (!active) return;
				
				// Map teams data
				const teamsMap: Record<number, Team> = {};
				(teamsData || []).forEach((team: any) => {
					teamsMap[team.teamid] = {
						id: team.teamid,
						name: team.teamname,
						logoUrl: team.logourl || defaultTeamLogo
					};
				});
				
				// Combine matches with team data
				const matchesWithTeams: MatchWithTeams[] = (matchesData || []).map((match: any) => ({
					...match,
					hometeam: match.hometeamid ? teamsMap[match.hometeamid] : undefined,
					awayteam: match.awayteamid ? teamsMap[match.awayteamid] : undefined
				}));
				
				setMatches(matchesWithTeams);
				setTeams(Object.values(teamsMap));
			} catch (e: any) {
				if (!active) return;
				setError('Failed to load matches');
				setMatches([]);
			} finally {
				if (active) setLoading(false);
			}
		})();
		return () => { active = false; };
	}, []);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return (matches || []).filter((m: MatchWithTeams) => {
			// Filter by "my matches" if enabled and user has a team
			if (myOnly && user?.teamid) {
				const isMyTeamPlaying = m.hometeamid === user.teamid || m.awayteamid === user.teamid;
				if (!isMyTeamPlaying) return false;
			}
			
			// Filter by date
			if (selectedDate) {
				const d = (m.matchdate || '').slice(0, 10);
				if (d !== selectedDate) return false;
			}
			
			// Filter by search query
			if (!q) return true;
			
			// Search in team names, match round, and status
			const homeTeamName = m.hometeam?.name?.toLowerCase() || '';
			const awayTeamName = m.awayteam?.name?.toLowerCase() || '';
			const round = m.round?.toLowerCase() || '';
			const status = m.status?.toLowerCase() || '';
			
			return homeTeamName.includes(q) || 
				   awayTeamName.includes(q) || 
				   round.includes(q) || 
				   status.includes(q);
		});
	}, [matches, query, selectedDate, myOnly, user?.teamid]);

	// Group matches by day
	const groupedMatches = useMemo(() => {
		const today = new Date();
		const todayString = today.toISOString().split('T')[0];
		
		const groups: Record<string, MatchWithTeams[]> = {};
		
		filtered.forEach((match) => {
			const matchDate = new Date(match.matchdate);
			const dateString = matchDate.toISOString().split('T')[0];
			
			// Determine the display label for the date
			let dateLabel: string;
			if (dateString === todayString) {
				dateLabel = 'Today';
			} else {
				// Format as "Day, Month Date" (e.g., "Mon, Dec 25")
				dateLabel = matchDate.toLocaleDateString('en-US', { 
					weekday: 'short', 
					month: 'short', 
					day: 'numeric' 
				});
			}
			
			if (!groups[dateLabel]) {
				groups[dateLabel] = [];
			}
			groups[dateLabel].push(match);
		});
		
		// Sort groups by date (Today first, then chronological order)
		const sortedGroups = Object.entries(groups).sort(([a], [b]) => {
			if (a === 'Today') return -1;
			if (b === 'Today') return 1;
			
			// Parse the date strings for comparison
			const dateA = new Date(a);
			const dateB = new Date(b);
			return dateA.getTime() - dateB.getTime();
		});
		
		return sortedGroups;
	}, [filtered]);

	return (
		<div className="MatchesPage">
			<div className="matches-strap">MATCHES</div>
			<div className="matches-section">
				<div className="matches-controls">
					<input className="search-input" type="text" placeholder="Search team or league..." value={query} onChange={(e)=>setQuery(e.target.value)} />
					<input className="date-input" type="date" value={selectedDate} onChange={(e)=>setSelectedDate(e.target.value)} />
					<button 
						className={`only-mine${myOnly ? ' is-on' : ''}`} 
						onClick={()=>setMyOnly(v=>!v)}
						disabled={!user?.teamid}
						title={!user?.teamid ? "You need to be assigned to a team to use this filter" : ""}
					>
						{user?.teamname ? `Only ${user.teamname} matches` : 'Only my matches'}
					</button>
				</div>

				{loading && (
					<div className='empty' style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
						<Spinner color="white" size="md" />
						<span style={{ marginLeft: '10px' }}>Loading...</span>
					</div>
				)}
				
				{!loading && groupedMatches.map(([dateLabel, dayMatches]) => (
					<div key={dateLabel} className="match-day-group">
						<div className="match-day-header">
							<h3 className="match-day-title">{dateLabel}</h3>
							<span className="match-count">{dayMatches.length} match{dayMatches.length !== 1 ? 'es' : ''}</span>
						</div>
						<div className="match-day-matches">
							{dayMatches.map((m: MatchWithTeams) => (
								<div className='match-card' key={m.matchid}>
									<div className='first-team'>
										<img 
											src={m.hometeam?.logoUrl || defaultTeamLogo} 
											alt={`${m.hometeam?.name || 'Home Team'} logo`}
										/>
										<h2>{m.hometeam?.name || 'TBD'}</h2>
									</div>
									<div className='match-details-card'>
										<h3 className='kickoff-time'>
											{new Date(m.matchdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
										</h3>
										<div className='match-round'>{m.round}</div>
										<div className={`match-status status-${m.status.toLowerCase()}`}>
											{m.status}
										</div>
									</div>
									<div className='second-team'>
										<img 
											src={m.awayteam?.logoUrl || defaultTeamLogo} 
											alt={`${m.awayteam?.name || 'Away Team'} logo`}
										/>
										<h2>{m.awayteam?.name || 'TBD'}</h2>
									</div>
								</div>
							))}
						</div>
					</div>
				))}
				
				{!loading && groupedMatches.length === 0 && (
					<div className='empty' style={{color:'white'}}>{error || 'No matches found.'}</div>
				)}
			</div>
		</div>
	);
};

export default Matches;



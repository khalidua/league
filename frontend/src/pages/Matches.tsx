import React, { useEffect, useMemo, useState } from 'react';
import './Matches.css';
import { api } from '../api/client';
import Spinner from '../components/Spinner';

const Matches: React.FC = () => {
	const [query, setQuery] = useState('');
	const [selectedDate, setSelectedDate] = useState<string>('');
	const [myOnly, setMyOnly] = useState(false);
	const [matches, setMatches] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;
		(async () => {
			setLoading(true);
			setError(null);
			try {
				const raw = await api.listMatches();
				if (!active) return;
				setMatches(raw || []);
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
		return (matches || []).filter((m: any) => {
			if (selectedDate) {
				const d = (m.matchdate || '').slice(0, 10);
				if (d !== selectedDate) return false;
			}
			if (!q) return true;
			return String(m.hometeamid).includes(q) || String(m.awayteamid).includes(q) || String(m.tournamentid).includes(q);
		});
	}, [matches, query, selectedDate]);

	return (
		<div className="MatchesPage">
			<div className="matches-strap">MATCHES</div>
			<div className="matches-section">
				<div className="matches-controls">
					<input className="search-input" type="text" placeholder="Search team or league..." value={query} onChange={(e)=>setQuery(e.target.value)} />
					<input className="date-input" type="date" value={selectedDate} onChange={(e)=>setSelectedDate(e.target.value)} />
					<button className={`only-mine${myOnly ? ' is-on' : ''}`} onClick={()=>setMyOnly(v=>!v)}>
						Only my matches
					</button>
				</div>

				{loading && (
					<div className='empty' style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
						<Spinner color="white" size="md" />
						<span style={{ marginLeft: '10px' }}>Loading...</span>
					</div>
				)}
				{!loading && filtered.map((m: any) => (
					<div className='match-card' key={m.matchid}>
						<div className='first-team'>
							<img src={'/vite.svg'} alt={`Home ${m.hometeamid}`}/>
							<h2>Team {m.hometeamid || '—'}</h2>
						</div>
						<div className='match-details-card'>
							<h3 className='kickoff-time'>{new Date(m.matchdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</h3>
						</div>
						<div className='second-team'>
							<img src={'/vite.svg'} alt={`Away ${m.awayteamid}`}/>
							<h2>Team {m.awayteamid || '—'}</h2>
						</div>
					</div>
				))}
				{!loading && filtered.length === 0 && (
					<div className='empty' style={{color:'white'}}>{error || 'No matches found.'}</div>
				)}
			</div>
		</div>
	);
};

export default Matches;



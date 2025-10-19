import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getApiUrl } from '../api/client';
import defaultTeamLogo from '../assets/default_team.png';
import Spinner from '../components/Spinner';
import PlayerCard from '../components/PlayerCard';
import './TeamDetail.css';
import { useAuth } from '../contexts/AuthContext';

type Team = {
	teamid: number;
	teamname: string;
	logourl?: string;
	teamcaptainid?: number;
	createdat?: string;
	description?: string;
};

type Player = {
	playerid: number;
	userid?: number;
	teamid?: number;
	position?: string;
	jerseynumber?: number;
	statsid?: number;
	preferredfoot?: string;
	height?: number;
	weight?: number;
	firstname?: string;
	lastname?: string;
	email?: string;
	profileimage?: string;
};

const TeamDetail: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { isAuthenticated, user } = useAuth();
	const [team, setTeam] = useState<Team | null>(null);
	const [players, setPlayers] = useState<Player[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [joinLoading, setJoinLoading] = useState(false);
	const [joinPending, setJoinPending] = useState(false);
	const [leaveLoading, setLeaveLoading] = useState(false);

	useEffect(() => {
		const loadTeamData = async () => {
			if (!id) return;
			setLoading(true);
			setError(null);
			try {
				const [teamData, playersData] = await Promise.all([
					fetch(getApiUrl(`/teams/${id}`)).then(res => {
						if (!res.ok) throw new Error('Team not found');
						return res.json();
					}),
					api.listPlayers({ teamid: parseInt(id) })
				]);
				setTeam(teamData);
				setPlayers(playersData);
			} catch (e: any) {
				setError(e.message || 'Failed to load team data');
			} finally {
				setLoading(false);
			}
		};
		loadTeamData();
	}, [id]);

	// Poll notifications to update pending/denied state
	useEffect(() => {
		if (!isAuthenticated || !user || !id) return;
		let cancelled = false;
		const check = async () => {
			try {
				const list = await api.listNotifications();
				if (cancelled) return;
				// If there is a join_request_result for this team and user was denied, clear pending
				const denied = (list || []).some((n: any) => {
					try {
						const m = n.metadata ? JSON.parse(n.metadata) : undefined;
						return n.type === 'join_request_result' && m && m.teamid === Number(id) && m.result === 'denied';
					} catch { return false; }
				});
				if (denied) setJoinPending(false);
			} catch {}
		};
		const interval = setInterval(check, 15000);
		check();
		return () => { cancelled = true; clearInterval(interval); };
	}, [isAuthenticated, user, id]);

	if (loading) {
		return (
			<div className="TeamDetailPage">
				<div className="team-detail-loading">
					<Spinner color="white" size="lg" />
					<span style={{ color: 'white', marginLeft: '10px' }}>Loading team details...</span>
				</div>
			</div>
		);
	}

	if (error || !team) {
		return (
			<div className="TeamDetailPage">
				<div className="team-detail-error">
					<h2>Team Not Found</h2>
					<p>{error || 'The team you are looking for does not exist.'}</p>
					<button onClick={() => navigate('/teams')} className="back-btn">
						Back to Teams
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="TeamDetailPage">
			<div className="team-detail-header">
				<div className="back-button-container">
					<button onClick={() => navigate('/teams')} className="back-btn">
						← Back to Teams
					</button>
				</div>
				<div className="team-detail-title">TEAM DETAILS</div>
			</div>

			<div className="team-detail-content">
				<div className="team-info-card">
					<div className="team-logo-section">
						<div className="team-logo-container">
							<img 
								className="team-logo-large" 
								src={team.logourl || defaultTeamLogo} 
								alt={`${team.teamname} logo`} 
							/>
						</div>
					</div>
					<div className="team-info-section">
						<h1 className="team-name-large">{team.teamname}</h1>
						{error && (
							<div style={{ color: '#E62727', marginBottom: '16px', padding: '8px', background: 'rgba(230, 39, 39, 0.1)', borderRadius: '8px', fontSize: '0.9rem' }}>
								{error}
							</div>
						)}
						{team.description && (
							<p className="team-description">{team.description}</p>
						)}
						<div className="team-meta-info">
							<div className="meta-item">
								<span className="meta-label">Team ID:</span>
								<span className="meta-value">{team.teamid}</span>
							</div>
							{team.createdat && (
								<div className="meta-item">
									<span className="meta-label">Founded:</span>
									<span className="meta-value">
										{new Date(team.createdat).toLocaleDateString()}
									</span>
								</div>
							)}
							{team.teamcaptainid && (
								<div className="meta-item">
									<span className="meta-label">Captain ID:</span>
									<span className="meta-value">{team.teamcaptainid}</span>
								</div>
							)}
						</div>
						{isAuthenticated && !user?.teamid && (
							<div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
								<button
									type="button"
									className={`join-team-btn${joinPending ? ' is-pending' : ''}`}
									disabled={joinLoading || joinPending}
									onClick={async () => {
										setJoinLoading(true);
										try {
											await api.createJoinRequest(team.teamid);
											setJoinPending(true);
										} catch (e: any) {
											setError(e.message || 'Failed to send join request');
										} finally {
											setJoinLoading(false);
										}
									}}
								>
									{joinLoading ? 'Sending...' : joinPending ? 'Pending' : 'Request to Join'}
								</button>
							</div>
						)}
						{isAuthenticated && user?.teamid === team.teamid && user?.playerid !== team.teamcaptainid && (
							<div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
								<button
									type="button"
									className="leave-team-btn"
									disabled={leaveLoading}
									onClick={async () => {
										if (!confirm('Are you sure you want to leave this team?')) return;
										setLeaveLoading(true);
										try {
											await api.leaveTeam();
											// Refresh the page to update the UI
											window.location.reload();
										} catch (e: any) {
											setError(e.message || 'Failed to leave team');
										} finally {
											setLeaveLoading(false);
										}
									}}
								>
									{leaveLoading ? 'Leaving...' : 'Leave Team'}
								</button>
							</div>
						)}
					</div>
				</div>

				<div className="team-players-section">
					<h2 className="section-title">Squad ({players.length} players)</h2>
					{players.length > 0 ? (
						<div className="players-cards-grid">
							{players.map(player => (
								<div 
									key={player.playerid}
									onClick={() => navigate(`/players/${player.playerid}`)}
									className="player-card-wrapper"
								>
									<PlayerCard 
										player={player} 
										isCaptain={player.playerid === team?.teamcaptainid}
									/>
								</div>
							))}
						</div>
					) : (
						<div className="no-players">
							<p>No players found for this team.</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default TeamDetail;

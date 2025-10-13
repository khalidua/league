import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getApiUrl } from '../api/client';
import defaultTeamLogo from '../assets/default_team.png';
import editIcon from '../assets/icons8-edit-24.png';
import Spinner from '../components/Spinner';
import PlayerCard from '../components/PlayerCard';
import './TeamDetail.css';

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
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [team, setTeam] = useState<Team | null>(null);
	const [players, setPlayers] = useState<Player[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);

	useEffect(() => {
		const loadTeamData = async () => {
			if (!id) return;
			
			setLoading(true);
			setError(null);
			
			try {
				// Fetch team details and players in parallel using efficient API
				const [teamData, playersData] = await Promise.all([
					fetch(getApiUrl(`/teams/${id}`)).then(res => {
						if (!res.ok) throw new Error('Team not found');
						return res.json();
					}),
					api.listPlayers({ teamid: parseInt(id) }) // Efficient: filter on backend
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

	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file || !team) return;

		setUploading(true);
		setError(null);
		
		try {
			const formData = new FormData();
			formData.append('file', file);

			console.log('Uploading file:', file.name, file.type, file.size);

			const response = await fetch(getApiUrl('/upload'), {
				method: 'POST',
				body: formData,
			});

			console.log('Upload response status:', response.status);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('Upload failed:', errorText);
				throw new Error(`Upload failed: ${response.status} - ${errorText}`);
			}

			const result = await response.json();
			console.log('Upload result:', result);
			
			// Update team with new logo URL
			const updateResponse = await fetch(getApiUrl(`/teams/${team.teamid}`), {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					...team,
					logourl: result.image_url,
				}),
			});

			if (updateResponse.ok) {
				setTeam(prev => prev ? { ...prev, logourl: result.image_url } : null);
				console.log('Team updated successfully');
			} else {
				console.error('Failed to update team');
			}
		} catch (error) {
			console.error('Upload error:', error);
			setError(`Failed to upload logo: ${error instanceof Error ? error.message : 'Unknown error'}`);
		} finally {
			setUploading(false);
		}
	};

	const handleUploadClick = () => {
		fileInputRef.current?.click();
	};

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
							{uploading ? (
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
									<Spinner color="white" size="lg" />
								</div>
							) : (
								<img 
									className="team-logo-large" 
									src={team.logourl || defaultTeamLogo} 
									alt={`${team.teamname} logo`} 
								/>
							)}
							<button 
								className="edit-logo-btn" 
								onClick={handleUploadClick}
								disabled={uploading}
								title={team.logourl ? "Edit logo" : "Upload logo"}
							>
								{team.logourl ? (
									<img src={editIcon} alt="Edit" width="16" height="16" style={{ filter: 'brightness(0) invert(1)' }} />
								) : "+"}
							</button>
						</div>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							onChange={handleFileUpload}
							className="hidden-file-input"
						/>
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

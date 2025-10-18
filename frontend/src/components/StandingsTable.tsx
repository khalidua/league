import React from 'react';
import './StandingsTable.css';

export type StandingsTeam = {
	/** Unique identifier for stable keying */
	id: string | number;
	name: string;
	logoUrl: string;
	played: number;
	wins: number; // wins
	draws: number;
	losses: number;
	goalsFor: number;
	goalsAgainst: number;
	goalDifference: number;
	points: number;
	/** Optional recent form string like W-W-D-L */
	form?: string;
};

export type StandingsTableProps = {
	teams: StandingsTeam[];
	/** Show the recent form column if provided */
	showForm?: boolean;
	/** Optional table caption/title displayed above */
	title?: string;
};

const StandingsTable: React.FC<StandingsTableProps> = ({ teams, showForm = true, title }) => {
	// Defensive copy and sort by points desc, then goal difference, then goals for
	const sortedTeams = [...teams].sort((a, b) => {
		if (b.points !== a.points) return b.points - a.points;
		if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
		return b.goalsFor - a.goalsFor;
	});

	// Debug form data
	console.log('StandingsTable teams:', teams);
	teams.forEach(team => {
		console.log(`Team ${team.name} form:`, team.form);
	});

	return (
		<div className="standings-wrapper">
			{title ? <h2 className="standings-title">{title}</h2> : null}
			<div className="standings-card">
				<table className="standings-table" role="table" aria-label={title ?? 'League standings'}>
					<thead>
						<tr>
							<th className="col-pos" scope="col">#</th>
							<th className="col-team" scope="col">Team</th>
							<th scope="col">P</th>
							<th scope="col">W</th>
							<th scope="col">D</th>
							<th scope="col">L</th>
							<th scope="col">GF</th>
							<th scope="col">GA</th>
							<th scope="col">GD</th>
							<th className="col-pts" scope="col">Pts</th>
							{showForm ? <th className="col-form" scope="col">Form</th> : null}
						</tr>
					</thead>
					<tbody>
						{sortedTeams.map((team, index) => (
							<tr key={team.id} className="standings-row">
								<td className="col-pos" aria-label="Position">{index + 1}</td>
								<td className="col-team">
									<div className="team-cell">
										<img
											className="team-logo"
											src={team.logoUrl}
											alt={`${team.name} logo`}
											width={24}
											height={24}
											loading="lazy"
										/>
										<span className="team-name">{team.name}</span>
									</div>
								</td>
								<td>{team.played}</td>
								<td>{team.wins}</td>
								<td>{team.draws}</td>
								<td>{team.losses}</td>
								<td>{team.goalsFor}</td>
								<td>{team.goalsAgainst}</td>
								<td>{team.goalDifference}</td>
								<td className="col-pts">{team.points}</td>
								{showForm ? <td className="col-form">{team.form ?? '-'}</td> : null}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default StandingsTable;



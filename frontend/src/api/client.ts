import { getCachedData, setCachedData } from '../utils/cache';

const LOCAL_API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || "";
const PRODUCTION_API_BASE = "https://zc-league-axckdddkdkbpeuc3.israelcentral-01.azurewebsites.net";

// In production (deployed), use production API directly
// In development, use local API with fallback
const isProduction = import.meta.env.PROD;
export const API_BASE = isProduction ? PRODUCTION_API_BASE : LOCAL_API_BASE;

// Helper function to get the full API URL for direct fetch calls
export const getApiUrl = (path: string) => `${API_BASE}/api${path}`;

async function request<T>(path: string, init?: RequestInit, useCache: boolean = true): Promise<T> {
	// Only cache GET requests
	const cacheKey = init?.method === 'GET' || !init?.method ? `GET:${path}` : null;
	
	if (useCache && cacheKey) {
		const cached = getCachedData<T>(cacheKey);
		if (cached) {
			return cached;
		}
	}

	// Get auth token - check both possible key names for compatibility
	const token = localStorage.getItem('access_token') || localStorage.getItem('token');
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	
	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	// Use the appropriate API base URL
	const url = `${API_BASE}/api${path}`;

	try {
		const res = await fetch(url, {
			headers: { ...headers, ...(init?.headers || {}) },
			...init,
		});
		
		if (res.ok) {
			const data = await res.json() as T;
			
			// Cache successful GET responses
			if (useCache && cacheKey) {
				setCachedData(cacheKey, data);
			}
			
			return data;
		} else {
			const text = await res.text().catch(() => "");
			
			// Handle 403 Forbidden (role-based access denied)
			if (res.status === 403) {
				throw new Error("Access denied. You don't have permission to perform this action.");
			}
			
			// Handle 401 Unauthorized (authentication required)
			if (res.status === 401) {
				// Clear invalid token
				localStorage.removeItem('access_token');
				localStorage.removeItem('token');
				throw new Error("Authentication required. Please log in again.");
			}
			
			throw new Error(text || `Request failed: ${res.status}`);
		}
	} catch (error) {
		throw error instanceof Error ? error : new Error('Network error');
	}
}

export const api = {
	// Authentication
	login: (email: string, password: string) => 
		request<any>(`/auth/login`, {
			method: 'POST',
			body: JSON.stringify({ email, password }),
		}, false),
	register: (email: string, password: string, firstname?: string, lastname?: string, role?: string) =>
		request<any>(`/auth/register`, {
			method: 'POST',
			body: JSON.stringify({ email, password, firstname, lastname, role }),
		}, false),
	getCurrentUser: () => request<any>(`/auth/me`),
	
	// Users
	listUsers: () => request<any[]>('/users'),
	updateUser: (userid: number, data: any) => request<any>(`/users/${userid}`, {
		method: 'PATCH',
		body: JSON.stringify(data)
	}, false),
	updateProfile: (data: { 
		firstname?: string; 
		lastname?: string; 
		email?: string; 
		role?: string; 
		profileimage?: string | null;
		// Player-specific fields
		position?: string | null;
		jerseynumber?: number | null;
		preferredfoot?: string | null;
		height?: number | null;
		weight?: number | null;
	}) =>
		request<any>(`/auth/me`, {
			method: 'PATCH',
			body: JSON.stringify(data),
		}, false),
	logout: () => request<any>(`/auth/logout`, { method: 'POST' }, false),
	
	// Other APIs
	listTeams: () => request<any[]>(`/teams`),
	getTeam: (teamid: number) => request<any>(`/teams/${teamid}`),
	createTeam: (data: any) => request<any>('/teams', {
		method: 'POST',
		body: JSON.stringify(data)
	}, false),
	updateTeam: (teamid: number, data: any) => request<any>(`/teams/${teamid}`, {
		method: 'PATCH',
		body: JSON.stringify(data)
	}, false),
	deleteTeam: (teamid: number) => request<any>(`/teams/${teamid}`, {
		method: 'DELETE'
	}, false),
	listPlayers: (params?: { teamid?: number; skip?: number; limit?: number }) => {
		const qs = new URLSearchParams();
		if (params?.teamid) qs.set('teamid', params.teamid.toString());
		if (params?.skip) qs.set('skip', params.skip.toString());
		if (params?.limit) qs.set('limit', params.limit.toString());
		const suffix = qs.toString() ? `?${qs.toString()}` : '';
		return request<any[]>(`/players${suffix}`);
	},
	getPlayer: (playerid: number) => request<any>(`/players/${playerid}`, undefined, false),
	createPlayer: (data: any) => request<any>('/players', {
		method: 'POST',
		body: JSON.stringify(data)
	}, false),
	updatePlayer: (playerid: number, data: any) => request<any>(`/players/${playerid}`, {
		method: 'PATCH',
		body: JSON.stringify(data)
	}, false),
	
	// Tournaments
	listTournaments: () => request<any[]>(`/tournaments`),
	createTournament: (data: any) => request<any>('/tournaments', {
		method: 'POST',
		body: JSON.stringify(data)
	}, false),
	updateTournament: (tournamentid: number, data: any) => request<any>(`/tournaments/${tournamentid}`, {
		method: 'PATCH',
		body: JSON.stringify(data)
	}, false),
	deleteTournament: (tournamentid: number) => request<any>(`/tournaments/${tournamentid}`, {
		method: 'DELETE'
	}, false),
	
	// Matches
	listMatches: (params?: { status?: string; round?: string }) => {
		const qs = new URLSearchParams();
		if (params?.status) qs.set('status', params.status);
		if (params?.round) qs.set('round', params.round);
		const suffix = qs.toString() ? `?${qs.toString()}` : '';
		return request<any[]>(`/matches${suffix}`);
	},
	getMatch: (matchid: number) => request<any>(`/matches/${matchid}`, undefined, false),
	createMatch: (data: any) => request<any>('/matches', {
		method: 'POST',
		body: JSON.stringify(data)
	}, false),
	updateMatch: (matchid: number, data: any) => request<any>(`/matches/${matchid}`, {
		method: 'PATCH',
		body: JSON.stringify(data)
	}, false),
	deleteMatch: (matchid: number) => request<any>(`/matches/${matchid}`, {
		method: 'DELETE'
	}, false),
	getNextUpcomingMatch: () => request<any>(`/matches/next-upcoming`),
	
	// Match Results
	listMatchResults: () => request<any[]>(`/match-results`),
	createMatchResult: (data: any) => request<any>('/match-results', {
		method: 'POST',
		body: JSON.stringify(data)
	}, false),
	updateMatchResult: (resultid: number, data: any) => request<any>(`/match-results/${resultid}`, {
		method: 'PATCH',
		body: JSON.stringify(data)
	}, false),
	deleteMatchResult: (resultid: number) => request<any>(`/match-results/${resultid}`, {
		method: 'DELETE'
	}, false),
	
	// Tournament Groups
	listTournamentGroups: () => request<any[]>(`/tournament-groups`),
	createTournamentGroup: (data: any) => request<any>('/tournament-groups', {
		method: 'POST',
		body: JSON.stringify(data)
	}, false),
	updateTournamentGroup: (groupid: number, data: any) => request<any>(`/tournament-groups/${groupid}`, {
		method: 'PATCH',
		body: JSON.stringify(data)
	}, false),
	deleteTournamentGroup: (groupid: number) => request<any>(`/tournament-groups/${groupid}`, {
		method: 'DELETE'
	}, false),
	
	// Group Teams
	listGroupTeams: () => request<any[]>(`/group-teams`),
	createGroupTeam: (data: any) => request<any>('/group-teams', {
		method: 'POST',
		body: JSON.stringify(data)
	}, false),
	deleteGroupTeam: (groupid: number, teamid: number) => request<any>(`/group-teams/${groupid}/${teamid}`, {
		method: 'DELETE'
	}, false),
	
	// Tournament Teams
	listTournamentTeams: () => request<any[]>(`/tournament-teams`),
	createTournamentTeam: (data: any) => request<any>('/tournament-teams', {
		method: 'POST',
		body: JSON.stringify(data)
	}, false),
	deleteTournamentTeam: (tournamentid: number, teamid: number) => request<any>(`/tournament-teams/${tournamentid}/${teamid}`, {
		method: 'DELETE'
	}, false),
	
	// Standings
	listStandings: (groupid?: number) => request<any[]>(`/standings${groupid ? `?groupid=${groupid}` : ''}`),
	listAdmins: () => request<any[]>(`/admins`),
	listPlayerStats: () => request<any[]>(`/playerstats`),
	getPlayerStats: (statsid: number) => request<any>(`/playerstats/${statsid}`),
	createPlayerStats: (data: any) => request<any>('/playerstats', {
		method: 'POST',
		body: JSON.stringify(data)
	}, false),
	listMatches: (params?: { status?: string; round?: string }) => {
		const qs = new URLSearchParams();
		if (params?.status) qs.set('status', params.status);
		if (params?.round) qs.set('round', params.round);
		const suffix = qs.toString() ? `?${qs.toString()}` : '';
		return request<any[]>(`/matches${suffix}`);
	},
	getNextUpcomingMatch: () => request<any>(`/matches/next-upcoming`),
	listEvents: () => request<any[]>(`/events`),
	
	// Image Upload
	uploadImage: (file: File) => {
		const formData = new FormData();
		formData.append('file', file);
		return request<any>('/upload', {
			method: 'POST',
			body: formData
		}, false);
	},
	deleteImage: (publicId: string) => request<any>(`/upload/${publicId}`, {
		method: 'DELETE'
	}, false),
	deleteProfileImage: () => request<any>('/upload/profile', {
		method: 'DELETE'
	}, false),

	// Goals API
	listMatchGoals: (matchId: number) => request<any[]>(`/goals/match/${matchId}`),
	createGoal: (data: any) => request<any>('/goals', {
		method: 'POST',
		body: JSON.stringify(data)
	}, false),
	deleteGoal: (goalId: number) => request<any>(`/goals/${goalId}`, {
		method: 'DELETE'
	}, false),
};

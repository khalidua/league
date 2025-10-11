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
	listUsers: () => request<any[]>(`/users`),
	listTeams: () => request<any[]>(`/teams`),
	listPlayers: (params?: { teamid?: number; skip?: number; limit?: number }) => {
		const qs = new URLSearchParams();
		if (params?.teamid) qs.set('teamid', params.teamid.toString());
		if (params?.skip) qs.set('skip', params.skip.toString());
		if (params?.limit) qs.set('limit', params.limit.toString());
		const suffix = qs.toString() ? `?${qs.toString()}` : '';
		return request<any[]>(`/players${suffix}`);
	},
	listAdmins: () => request<any[]>(`/admins`),
	listPlayerStats: () => request<any[]>(`/playerstats`),
	getPlayerStats: (statsid: number) => request<any>(`/playerstats/${statsid}`),
	listMatches: (params?: { status?: string; round?: string }) => {
		const qs = new URLSearchParams();
		if (params?.status) qs.set('status', params.status);
		if (params?.round) qs.set('round', params.round);
		const suffix = qs.toString() ? `?${qs.toString()}` : '';
		return request<any[]>(`/matches${suffix}`);
	},
	getNextUpcomingMatch: () => request<any>(`/matches/next-upcoming`),
	listEvents: () => request<any[]>(`/events`),
};

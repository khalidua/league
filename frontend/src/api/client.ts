import { getCachedData, setCachedData } from '../utils/cache';

const LOCAL_API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || "";
const PRODUCTION_API_BASE = "https://league-ts6a.onrender.com";

export const API_BASE = LOCAL_API_BASE;

async function request<T>(path: string, init?: RequestInit, useCache: boolean = true): Promise<T> {
	// Only cache GET requests
	const cacheKey = init?.method === 'GET' || !init?.method ? `GET:${path}` : null;
	
	if (useCache && cacheKey) {
		const cached = getCachedData<T>(cacheKey);
		if (cached) {
			return cached;
		}
	}

	// Try local API first, then fallback to production
	const urls = [
		`${LOCAL_API_BASE}/api${path}`,
		`${PRODUCTION_API_BASE}/api${path}`
	];

	let lastError: Error | null = null;

	for (const url of urls) {
		try {
			const res = await fetch(url, {
				headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
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
				lastError = new Error(text || `Request failed: ${res.status}`);
			}
		} catch (error) {
			lastError = error instanceof Error ? error : new Error('Network error');
		}
	}

	throw lastError || new Error('All API endpoints failed');
}

export const api = {
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
	listPlayerStats: () => request<any[]>(`/playerstats`),
	listMatches: (params?: { status?: string; round?: string }) => {
		const qs = new URLSearchParams();
		if (params?.status) qs.set('status', params.status);
		if (params?.round) qs.set('round', params.round);
		const suffix = qs.toString() ? `?${qs.toString()}` : '';
		return request<any[]>(`/matches${suffix}`);
	},
	listEvents: () => request<any[]>(`/events`),
};

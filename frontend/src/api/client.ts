import { getCachedData, setCachedData } from '../utils/cache';

export const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || "";

async function request<T>(path: string, init?: RequestInit, useCache: boolean = true): Promise<T> {
	// Only cache GET requests
	const cacheKey = init?.method === 'GET' || !init?.method ? `GET:${path}` : null;
	
	if (useCache && cacheKey) {
		const cached = getCachedData<T>(cacheKey);
		if (cached) {
			return cached;
		}
	}

	const res = await fetch(`${API_BASE}/api${path}`, {
		headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
		...init,
	});
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(text || `Request failed: ${res.status}`);
	}
	
	const data = await res.json() as T;
	
	// Cache successful GET responses
	if (useCache && cacheKey) {
		setCachedData(cacheKey, data);
	}
	
	return data;
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

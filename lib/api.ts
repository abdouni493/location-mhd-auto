// lib/api.ts - Centralized API helper for environment-aware API calls

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function apiFetch(endpoint: string, options?: RequestInit) {
  const url = `${API_URL}${endpoint}`;
  return fetch(url, options);
}

export async function apiPost(endpoint: string, body: any, options?: RequestInit) {
  return apiFetch(endpoint, {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(body),
  });
}

export async function apiGet(endpoint: string, options?: RequestInit) {
  return apiFetch(endpoint, {
    ...options,
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
}

export function getApiUrl(endpoint: string) {
  return `${API_URL}${endpoint}`;
}

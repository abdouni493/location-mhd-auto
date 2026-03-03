// lib/api.ts - Centralized API helper for environment-aware API calls

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function apiFetch(endpoint: string, options?: RequestInit) {
  const url = `${API_URL}${endpoint}`;
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error: any) {
    // Provide helpful error message for connection issues
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error(`Backend server not responding at ${API_URL}. Make sure the server is running (npm run server)`);
    }
    throw error;
  }
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

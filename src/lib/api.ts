import type { PhotoResponse } from '../types/api';

export async function apiRequest<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, { signal, headers: { Accept: 'application/json' } });
  if (!response.headers.get('Content-Type')?.includes('application/json')) {
    throw new Error('Your session may have expired. Reload the page to sign in.');
  }
  const body = await response.json();
  if (!response.ok || body.success === false) {
    throw new Error(body.error || `Request failed (${response.status})`);
  }
  return body as T;
}

export function photosPath(date?: string | null, cursor?: string | null): string {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (cursor) params.set('cursor', cursor);
  return `/api/photos?${params}`;
}

export function fetchPhotos(date: string, cursor: string, signal: AbortSignal): Promise<PhotoResponse> {
  return apiRequest(photosPath(date, cursor), signal);
}

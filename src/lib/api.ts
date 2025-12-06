import type { LatestSensorResponse, SensorResponse, PhotoResponse, UserResponse } from '../types/api';

const API_BASE = '/api';

export async function getLatestSensorData(): Promise<LatestSensorResponse> {
  const response = await fetch(`${API_BASE}/sensors/latest`);

  if (!response.ok) {
    throw new Error(`Failed to fetch sensor data: ${response.status}`);
  }

  return response.json();
}

export async function fetchSensorData(
  start: string,
  stop: string,
  limit = 1000
): Promise<SensorResponse> {
  const url = `${API_BASE}/sensors?start=${start}&stop=${stop}&limit=${limit}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch sensor data: ${response.status}`);
  }

  return response.json();
}

export async function fetchPhotos(date?: string): Promise<PhotoResponse> {
  const url = date ? `${API_BASE}/photos?date=${date}` : `${API_BASE}/photos`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch photos: ${response.status}`);
  }

  return response.json();
}

export function getPhotoUrl(filename: string, size?: number): string {
  return size
    ? `${API_BASE}/photos/${filename}?size=${size}`
    : `${API_BASE}/photos/${filename}`;
}

export async function getCurrentUser(): Promise<UserResponse> {
  const response = await fetch(`${API_BASE}/user`);

  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.status}`);
  }

  return response.json();
}

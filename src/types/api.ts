import type { SensorData } from '../../shared/sensors';
export type { SensorData } from '../../shared/sensors';

export interface LatestSensorResponse {
  count: number;
  data: SensorData;
  success: boolean;
}

export interface SensorResponse {
  truncated: boolean;
  count: number;
  data: SensorData[];
  success: boolean;
}

export interface Photo {
  key: string;
  camera: string;
  filename: string;
  timestamp: string;
  url: string;
  thumbnailUrl: string;
}

export interface PhotoResponse {
  count: number;
  date: string | null;
  photos: Photo[];
  cursor: string | null;
  success: boolean;
}

export interface User {
  email: string;
  userId: string | null;
  name: string;
}

export interface UserResponse {
  success: boolean;
  authenticated: boolean;
  user?: User;
  error?: string;
}

import { useQuery } from '@tanstack/react-query'
import type { LatestSensorResponse, SensorResponse, PhotoResponse } from '../types/api'

// Determine API base URL based on environment
function getApiBaseUrl(): string {
  // If running on localhost, use local API server
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:3000'
  }

  // If deployed, use relative URLs (worker will proxy to api.cabinpi.com)
  return ''
}

const API_BASE_URL = getApiBaseUrl()

export const apiClient = {
  async getLatestSensorData(): Promise<LatestSensorResponse> {
    const response = await fetch(`${API_BASE_URL}/api/sensors/latest`)
    if (!response.ok) throw new Error('Failed to fetch latest sensor data')
    return response.json()
  },

  async getSensorData(params?: {
    limit?: number
    start?: string
    stop?: string
  }): Promise<SensorResponse> {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.start) queryParams.append('start', params.start)
    if (params?.stop) queryParams.append('stop', params.stop)

    const url = `${API_BASE_URL}/api/sensors${queryParams.toString() ? `?${queryParams}` : ''}`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch sensor data')
    return response.json()
  },

  async getPhotos(date?: string): Promise<PhotoResponse> {
    const url = date
      ? `${API_BASE_URL}/api/photos?date=${date}`
      : `${API_BASE_URL}/api/photos`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch photos')
    return response.json()
  },

  getPhotoUrl(filename: string, size?: number): string {
    const sizeParam = size ? `?size=${size}` : ''
    return `${API_BASE_URL}/api/photos/${filename}${sizeParam}`
  },
}

export function useLatestSensorData(refreshInterval?: number) {
  return useQuery({
    queryKey: ['sensors', 'latest'],
    queryFn: () => apiClient.getLatestSensorData(),
    refetchInterval: refreshInterval,
  })
}

export function useSensorData(params?: {
  limit?: number
  start?: string
  stop?: string
}) {
  return useQuery({
    queryKey: ['sensors', params],
    queryFn: () => apiClient.getSensorData(params),
  })
}

export function usePhotos(date?: string) {
  return useQuery({
    queryKey: ['photos', date],
    queryFn: () => apiClient.getPhotos(date),
  })
}

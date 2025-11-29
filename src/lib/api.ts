'use server'

import { createServerFn } from '@tanstack/react-start'
import type { LatestSensorResponse, SensorResponse, PhotoResponse } from '../types/api'

const isDev = false // process.env.NODE_ENV === 'development'


function getAuthHeaders(): Headers {
  const headers = new Headers()

  if (!isDev) {
    const clientId = process.env.CF_ACCESS_CLIENT_ID
    const clientSecret = process.env.CF_ACCESS_CLIENT_SECRET

    if (clientId && clientSecret) {
      headers.set('CF-Access-Client-Id', clientId)
      headers.set('CF-Access-Client-Secret', clientSecret)
    }
  }
  return headers
}

export async function getLatestSensorData() {
  const apiUrl = 'https://api.cabinpi.com/api/sensors/latest'

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      console.log(response)
      throw new Error(`Failed to fetch sensor data: ${response.status} ${response.statusText}`)
    }


    const data: LatestSensorResponse = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching sensor data:', error)
    throw error
  }
}






export async function fetchSensorData(start: string, stop: string, limit = 1000): Promise<SensorResponse> {
  const baseUrl = 'https://api.cabinpi.com/api/sensors'

  const apiUrl = `${baseUrl}?start=${start}&stop=${stop}&limit=${limit}`

  try {
    const response = await fetch(apiUrl, { headers: getAuthHeaders() })
    if (!response.ok) {
      throw new Error(`Failed to fetch sensor data: ${response.status} ${response.statusText}`)
    }

    const data: SensorResponse = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching sensor data:', error)
    throw error
  }
}

export async function fetchPhotos(date?: string): Promise<PhotoResponse> {
  const baseUrl = isDev
    ? 'http://localhost:3000/api/photos'
    : 'https://api.cabinpi.com/api/photos'

  const apiUrl = date ? `${baseUrl}?date=${date}` : baseUrl

  try {
    const response = await fetch(apiUrl, { headers: getAuthHeaders() })
    if (!response.ok) {
      throw new Error(`Failed to fetch photos: ${response.status} ${response.statusText}`)
    }

    const result: PhotoResponse = await response.json()
    return result
  } catch (error) {
    console.error('Error fetching photos:', error)
    throw error
  }
}

export async function fetchPhotoImage(filename: string, size?: number): Promise<string> {
  const baseUrl = isDev
    ? 'http://localhost:3000/api/photos'
    : 'https://api.cabinpi.com/api/photos'

  const apiUrl = size ? `${baseUrl}/${filename}?size=${size}` : `${baseUrl}/${filename}`

  try {
    const response = await fetch(apiUrl, { headers: getAuthHeaders() })
    if (!response.ok) {
      throw new Error(`Failed to fetch photo: ${response.status} ${response.statusText}`)
    }

    // Get the image as an ArrayBuffer
    const arrayBuffer = await response.arrayBuffer()

    // Convert ArrayBuffer to base64 using Buffer (Node.js)
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')

    // Get content type from response headers or default to jpeg
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    // Return as data URL
    return `data:${contentType};base64,${base64}`
  } catch (error) {
    console.error('Error fetching photo image:', error)
    throw error
  }
}

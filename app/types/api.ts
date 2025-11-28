export interface SensorData {
  ampHours?: number
  avgStrikeDistance?: number
  batteryState?: number
  chargeState?: number
  classicState?: number
  dailyAccumulation?: number
  date?: string
  dispavgVbatt?: number
  dispavgVpv?: number
  extF?: number
  extHumidity?: number
  humidity?: number
  ibattDisplay?: number
  illuminance?: number
  inHg?: number
  intF?: number
  inverterAacOut?: number
  inverterFault?: number
  inverterMode?: number
  inverterOn?: boolean
  inverterVacOut?: number
  kwhours?: number
  niteMinutesNoPwr?: number
  pvInputCurrent?: number
  rain?: number
  solarRadiation?: number
  strikeCount?: number
  uv?: number
  vocLastMeasured?: number
  watts?: number
  windAvg?: number
  windDirection?: number
  windGust?: number
}

export interface LatestSensorResponse {
  data: SensorData
}

export interface SensorResponse {
  data: SensorData[]
}

export interface Photo {
  filename: string
  timestamp: string
}

export interface PhotoResponse {
  date: string
  photos: Photo[]
}

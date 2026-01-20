export interface SnowReport {
  snow24hIn: number;
  snow48hIn: number;
  snow7dIn: number;
  baseDepthIn: { min: number; max: number };
  seasonSnowIn: number;
  sourceUrl: string;
  fetchedAt: string;
  conditions: string;
}

export interface LiftCondition {
  name: string;
  status: string;
  type?: string;
  capacity?: number;
  waitTime?: number;
}

export interface TrailCondition {
  name: string;
  status: string;
  difficulty?: string;
  isGroomed?: boolean;
}

export interface LiftsTerrain {
  liftsOpen: number;
  liftsTotal: number;
  trailsOpen: number;
  trailsTotal: number;
  terrainOpenPct: number;
  lifts: LiftCondition[];
  trails: TrailCondition[];
  sourceUrl: string;
  fetchedAt: string;
}

export interface DailyForecast {
  date: string; // YYYY-MM-DD
  highF: number;
  lowF: number;
  windMph: number;
  precipIn: number;
  snowIn: number;
  conditions: string;
}

export interface WeatherData {
  currentTempF: number;
  todayHighF: number;
  todayLowF: number;
  windMph: number;
  windGustMph: number;
  conditions: string;
  daily: DailyForecast[];
  source: string;
  fetchedAt: string;
}

export interface MountainData {
  mountain: {
    slug: string;
    name: string;
    url: string;
    lastUpdated: string;
    location: string;
  };
  snowReport: SnowReport;
  liftsTerrain: LiftsTerrain;
  weather: WeatherData;
  summary: string;
  generatedAt: string;
}

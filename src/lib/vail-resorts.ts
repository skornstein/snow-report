import { MountainData, SnowReport, LiftsTerrain, LiftCondition, TrailCondition } from './types';
import { getWeatherData } from './weather';
import { promisify } from 'util';
import { exec } from 'child_process';
import * as cheerio from 'cheerio';

const execAsync = promisify(exec);

// --- Configuration ---
export interface VailResortConfig {
    id: string;
    name: string;
    weatherUrl: string; // URL for snow report/weather
    liftUrl: string;    // URL for lift/terrain status
    coords: { lat: number; long: number };
}

export const RESORTS: Record<string, VailResortConfig> = {
    'mount-snow': {
        id: 'mount-snow',
        name: 'Mount Snow',
        weatherUrl: 'https://www.mountsnow.com/the-mountain/mountain-conditions/weather-report.aspx',
        liftUrl: 'https://www.mountsnow.com/the-mountain/mountain-conditions/lift-and-terrain-status.aspx',
        coords: { lat: 42.9602, long: -72.8958 }
    },
    'okemo': {
        id: 'okemo',
        name: 'Okemo',
        weatherUrl: 'https://www.okemo.com/the-mountain/mountain-conditions/snow-and-weather-report.aspx',
        liftUrl: 'https://www.okemo.com/the-mountain/mountain-conditions/lift-and-terrain-status.aspx',
        coords: { lat: 43.4036, long: -72.7163 }
    }
};

// --- Helper: Fetch HTML (Minimal Headers to Bypass WAF) ---
async function fetchHtml(url: string): Promise<string> {
    console.log(`[VailResort] Fetching ${url} ...`);
    try {
        // Minimal curl command - found to bypass WAF for Mount Snow
        const cmd = `curl -s -L "${url}"`;
        const { stdout } = await execAsync(cmd);
        return stdout;
    } catch (e) {
        console.error(`[VailResort] Fetch error:`, e);
        throw new Error(`Failed to fetch ${url}`);
    }
}

// --- Main Scraper ---
export async function getVailResortData(resortId: string): Promise<MountainData> {
    const config = RESORTS[resortId];
    if (!config) throw new Error(`Unknown resort: ${resortId}`);

    console.log(`[VailResort] Starting scrape for ${config.name}`);

    // Parallel fetch: Weather API, Resort Weather Page, Resort Lift Page
    const [weather, weatherHtml, liftHtml] = await Promise.all([
        getWeatherData(config.coords.lat, config.coords.long),
        fetchHtml(config.weatherUrl),
        fetchHtml(config.liftUrl)
    ]);

    // --- Parse Snow Report (from Weather Page) ---
    // Look for FR.snowReportData = { ... };
    let snowReport: SnowReport = {
        snow24hIn: 0,
        snow48hIn: 0,
        snow7dIn: 0,
        seasonSnowIn: 0,
        baseDepthIn: { min: 0, max: 0 },
        conditions: 'Data Unavailable',
        fetchedAt: new Date().toISOString(),
        sourceUrl: config.weatherUrl
    };

    const snowMatch = weatherHtml.match(/FR\.snowReportData\s*=\s*({[\s\S]*?});/);
    if (snowMatch && snowMatch[1]) {
        try {
            const data = JSON.parse(snowMatch[1]);
            // Sample data structure based on debug:
            // {"OverallSnowConditions":"Snow Groomed","OvernightSnowfall":{"Inches":"1",...},"TwentyFourHourSnowfall":{"Inches":"2"...},"BaseDepth":...}

            const parseIn = (val: any) => typeof val === 'string' ? parseFloat(val) : (typeof val === 'number' ? val : 0);

            snowReport = {
                snow24hIn: parseIn(data.TwentyFourHourSnowfall?.Inches || data.OvernightSnowfall?.Inches),
                snow48hIn: parseIn(data.FortyEightHourSnowfall?.Inches),
                snow7dIn: parseIn(data.SevenDaySnowfall?.Inches),
                seasonSnowIn: parseIn(data.CurrentSeason?.Inches || data.SeasonTotal?.Inches),
                baseDepthIn: {
                    min: parseIn(data.BaseDepth?.Inches),
                    max: parseIn(data.BaseDepth?.Inches) // Only one value typically
                },
                conditions: data.OverallSnowConditions || 'Open', // Fallback
                fetchedAt: new Date().toISOString(),
                sourceUrl: config.weatherUrl
            };
        } catch (e) {
            console.error(`[VailResort] Error parsing snow report JSON for ${config.name}`, e);
        }
    } else {
        console.warn(`[VailResort] FR.snowReportData not found for ${config.name}`);
    }


    // --- Parse Lifts & Terrain (from Lift Page) ---
    // Look for FR.TerrainStatusFeed = { ... };
    let liftsTerrain: LiftsTerrain = {
        liftsOpen: 0,
        liftsTotal: 0,
        trailsOpen: 0,
        trailsTotal: 0,
        terrainOpenPct: 0,
        lifts: [],
        trails: [],
        fetchedAt: new Date().toISOString(),
        sourceUrl: config.liftUrl
    };

    const liftMatch = liftHtml.match(/FR\.TerrainStatusFeed\s*=\s*({[\s\S]*?});/);
    if (liftMatch && liftMatch[1]) {
        try {
            const data = JSON.parse(liftMatch[1]);
            // Structure: { Lifts: [...], GroomingAreas: [ { Trails: [...] } ] }

            const lifts = Array.isArray(data.Lifts) ? data.Lifts : [];
            let trails: any[] = [];

            if (Array.isArray(data.GroomingAreas)) {
                data.GroomingAreas.forEach((area: any) => {
                    if (Array.isArray(area.Trails)) {
                        trails = trails.concat(area.Trails);
                    }
                });
            } else if (Array.isArray(data.Trails)) {
                trails = data.Trails;
            }

            // Count open
            const isLiftOpen = (status: any) => status && (String(status).toLowerCase() === 'open' || String(status).toLowerCase() === 'open_priority' || String(status).toLowerCase() === 'scheduled' || String(status) === '1');
            const isTrailOpen = (t: any) => t.IsOpen === true || (t.Status && (String(t.Status).toLowerCase() === 'open' || String(t.Status) === '1'));

            const liftsOpen = lifts.filter((l: any) => isLiftOpen(l.Status)).length;
            const trailsOpen = trails.filter((t: any) => isTrailOpen(t)).length;

            liftsTerrain = {
                liftsOpen,
                liftsTotal: lifts.length,
                trailsOpen,
                trailsTotal: trails.length,
                terrainOpenPct: trails.length > 0 ? Math.round((trailsOpen / trails.length) * 100) : 0,
                lifts: lifts.map((l: any) => ({
                    name: l.Name || l.LiftName,
                    status: String(l.Status !== undefined ? l.Status : 'Closed'),
                    type: l.Type || l.LiftType,
                    waitTime: l.WaitTime
                })),
                trails: trails.map((t: any) => ({
                    name: t.Name,
                    difficulty: String(t.Difficulty),
                    status: String(t.Status !== undefined ? t.Status : (t.IsOpen ? 'Open' : 'Closed')),
                    isGroomed: t.IsGroomed
                })),
                fetchedAt: new Date().toISOString(),
                sourceUrl: config.liftUrl
            };

        } catch (e) {
            console.error(`[VailResort] Error parsing lift status JSON for ${config.name}`, e);
        }
    } else {
        console.warn(`[VailResort] FR.TerrainStatusFeed not found for ${config.name}`);
    }

    // Generate detailed summary
    const predictedSnow = (weather.daily[0]?.snowIn || 0) + (weather.daily[1]?.snowIn || 0);
    const summary = `The current ${config.name} base depth is ${Math.round(snowReport.baseDepthIn.max)} inches, with ${Math.round(snowReport.snow48hIn)} new inches of snow over the past 48 hours and ${Math.round(predictedSnow)} inches predicted today and tomorrow. ${liftsTerrain.trailsOpen}/${liftsTerrain.trailsTotal} trails are open, ${liftsTerrain.liftsOpen}/${liftsTerrain.liftsTotal} lifts are open, and ${liftsTerrain.terrainOpenPct}% of the total terrain is open.`;

    return {
        mountain: {
            name: config.name,
            lastUpdated: new Date().toISOString(),
            slug: resortId,
            location: 'Vermont, USA',
            url: config.weatherUrl
        },
        snowReport,
        weather,
        liftsTerrain,
        summary,
        generatedAt: new Date().toISOString()
    };
}

function generateSummary(mountainName: string, snow: any, lifts: any, weather: any): string {
    return `The current ${mountainName} base depth is ${snow.baseDepthIn.max} inches. ${lifts.trailsOpen}/${lifts.trailsTotal} trails are open.`;
}

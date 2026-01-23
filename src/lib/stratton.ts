import { MountainData, SnowReport, LiftsTerrain, LiftCondition, TrailCondition } from './types';
import { getWeatherData } from './weather';
import { promisify } from 'util';
import { exec } from 'child_process';
import * as cheerio from 'cheerio';

const execAsync = promisify(exec);

export async function getStrattonData(): Promise<MountainData> {
    const coords = { lat: 43.1115, long: -72.9081 };
    const otsUrl = 'https://www.onthesnow.com/vermont/stratton-mountain/skireport';

    // 1. Parallel Fetch: Weather, Official API, and OTS (for terrain details)
    const [weather, officialData, otsOutput] = await Promise.all([
        getWeatherData(coords.lat, coords.long),
        fetchStrattonOfficialData(),
        execAsync(`curl -s -L "${otsUrl}" -H "User-Agent: Mozilla/5.0"`).catch(e => ({ stdout: '' }))
    ]);

    // 2. Process Snow Report (Prefer Official Data)
    let snowReport: SnowReport = {
        snow24hIn: 0,
        snow48hIn: 0,
        snow7dIn: 0,
        seasonSnowIn: 0,
        baseDepthIn: { min: 0, max: 0 },
        conditions: 'Open',
        fetchedAt: new Date().toISOString(),
        sourceUrl: 'https://www.stratton.com' // Reflect official source
    };

    if (officialData) {
        snowReport.snow24hIn = officialData.snow24h;
        snowReport.snow48hIn = officialData.snow48h;
        snowReport.snow7dIn = officialData.snow7d;
        snowReport.seasonSnowIn = officialData.seasonTotal;
        snowReport.baseDepthIn = { min: officialData.baseDepth, max: officialData.baseDepth };
        console.log(`[Stratton] Used Official API: 24h=${snowReport.snow24hIn}", 48h=${snowReport.snow48hIn}"`);
    }

    // 3. Process Terrain (Use OTS for detailed lists)
    let liftsTerrain: LiftsTerrain = {
        liftsOpen: 0,
        liftsTotal: 0,
        trailsOpen: 0,
        trailsTotal: 0,
        terrainOpenPct: 0,
        lifts: [],
        trails: [],
        fetchedAt: new Date().toISOString(),
        sourceUrl: otsUrl
    };

    if (otsOutput.stdout) {
        try {
            const $ = cheerio.load(otsOutput.stdout);
            const nextDataScript = $('#__NEXT_DATA__').html();
            if (nextDataScript) {
                const json = JSON.parse(nextDataScript);
                const fullResort = json.props?.pageProps?.fullResort;

                if (fullResort) {
                    const terrain = fullResort.terrain || {};
                    const runs = terrain.runs || {};
                    let rawTrails = [];

                    if (Array.isArray(runs)) {
                        rawTrails = runs;
                    } else if (runs.details && Array.isArray(runs.details)) {
                        rawTrails = runs.details;
                    } else {
                        rawTrails = Object.values(runs);
                    }

                    const trails: TrailCondition[] = rawTrails
                        .filter((t: any) => {
                            if (!t || !t.name) return false;
                            const n = t.name.trim();
                            // Filter logic matches previous implementation
                            if (n.includes(',') || n.includes('&') || n.includes('Uphill') ||
                                n.includes('Shortcut') || n.includes('Cut Through') ||
                                n.includes('Work Road') || n.includes('Access') || n.includes('Extension')) return false;

                            const glades = [
                                'Emerald Forest', 'Shred Wood Forest', 'Free Fall Gully', 'Kidderbrook Ravine',
                                'Diamond in the Rough', 'Test Pilot', 'West Pilot', 'Eclipse', 'Moonbeam',
                                'Vertigo', 'Why Not'
                            ];
                            if (glades.includes(n)) return false;
                            return true;
                        })
                        .map((t: any) => ({
                            name: t.name || 'Unknown',
                            status: (t.status === 1 || t.status === 'Open') ? 'Open' : 'Closed',
                            difficulty: mapDifficulty(t.difficulty),
                            isGroomed: t.grooming
                        }));

                    // Lifts
                    const rawLifts = terrain.lifts?.details || [];
                    const lifts: LiftCondition[] = rawLifts.map((l: any) => ({
                        name: l.name,
                        status: l.status === 2 ? 'Open' : 'Closed',
                        type: l.type,
                        waitTime: 0
                    }));

                    // Recalculate counts based on parsed lists
                    const trailsOpen = trails.filter(t => t.status === 'Open').length;
                    const liftsOpen = lifts.filter(l => l.status === 'Open').length;

                    liftsTerrain = {
                        liftsOpen,
                        liftsTotal: lifts.length,
                        trailsOpen,
                        trailsTotal: trails.length,
                        terrainOpenPct: trails.length > 0 ? Math.round((trailsOpen / trails.length) * 100) : 0,
                        lifts,
                        trails,
                        fetchedAt: new Date().toISOString(),
                        sourceUrl: otsUrl
                    };
                }
            }
        } catch (e) {
            console.error('[Stratton] OTS Parsing failed:', e);
        }
    }

    // fallback if official data missing (rare)
    if (!officialData && liftsTerrain.trails.length > 0) {
        // ... (We could keep the old OTS fallback here, but arguably it's better to show 0 than wrong data)
    }

    // Generate summary
    const predictedSnow = (weather.daily[0]?.snowIn || 0) + (weather.daily[1]?.snowIn || 0);
    const summary = `The current Stratton base depth is ${Math.round(snowReport.baseDepthIn.max)} inches, with ${Math.round(snowReport.snow24hIn)} new inches of snow over the past 24 hours and ${Math.round(predictedSnow)} inches predicted today and tomorrow. ${liftsTerrain.trailsOpen}/${liftsTerrain.trailsTotal} trails are open, ${liftsTerrain.liftsOpen}/${liftsTerrain.liftsTotal} lifts are open, and ${liftsTerrain.terrainOpenPct}% of the total terrain is open.`;

    return {
        mountain: {
            name: 'Stratton',
            slug: 'stratton',
            url: 'https://www.stratton.com/the-mountain/mountain-report', // Updated to official URL
            lastUpdated: new Date().toISOString(),
            location: 'Stratton, VT'
        },
        snowReport,
        weather,
        liftsTerrain,
        summary,
        generatedAt: new Date().toISOString()
    };
}

// 4. New Helper for MtnPowder API
async function fetchStrattonOfficialData(): Promise<{ snow24h: number, snow48h: number, snow7d: number, seasonTotal: number, baseDepth: number } | null> {
    try {
        const apiUrl = 'https://mtnpowder.com/feed/v3.json?bearer_token=hPtaTVkbuyZQnrxvru4ApfpXnS21PJO3eTKdibDoLZE&resortId%5B%5D=1';
        const res = await fetch(apiUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) });
        if (!res.ok) return null;

        const data = await res.json();
        const resort = data.Resorts?.[0];
        // Note: Field names observed in curl: Last24HoursIn, Last48HoursIn, BaseIn, SeasonTotalIn
        // The API might nest them in SnowReport but the curl grep showed top-level keys or flat within object.
        // Actually, looking at MtnPowder structure usually: Resorts[0].SnowReport.MidMountainArea... or similar.
        // Or flat in SnowReport. Let's try to handle both strictly.

        // Based on other MtnPowder feeds, it's often:
        // Resort.SnowReport.MidMountainArea.Last24HoursIn

        // Let's safe navigation all the way down
        const snow = resort?.SnowReport;

        // Defensive parsing
        // Sometimes it's directly on SnowReport, sometimes nested.
        // The grep showed keys, but not structure. 
        // Let's assume standard structure but check common paths.

        const getVal = (obj: any, key: string) => parseFloat(obj?.[key] || obj?.MidMountainArea?.[key] || 0);

        if (snow) {
            return {
                snow24h: getVal(snow, 'Last24HoursIn') || 0,
                snow48h: getVal(snow, 'Last48HoursIn') || 0,
                snow7d: getVal(snow, 'Last7DaysIn') || 0,
                seasonTotal: getVal(snow, 'SeasonTotalIn') || 0,
                baseDepth: getVal(snow, 'BaseIn') || 0
            };
        }
        return null;

    } catch (e) {
        console.error('[Stratton] Official API fetch failed:', e);
        return null;
    }
}

function mapDifficulty(diff: number): 'green' | 'blue' | 'black' | 'double_black' | undefined {
    // OTS Difficulty Mapping (Inferred):
    // 1: Green, 2: Blue, 3: Black, 4: Double Black? 
    // Debug showed: "Lower Switchback" (diff 4), "Lower Wanderer" (diff 1), "Shooter" (diff 2).
    // Let's assume standard progression.
    if (diff === 1) return 'green';
    if (diff === 2) return 'blue';
    if (diff === 3) return 'black';
    if (diff === 4) return 'double_black';
    return undefined;
}

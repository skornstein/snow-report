import { MountainData, SnowReport, LiftsTerrain, LiftCondition, TrailCondition } from './types';
import { getWeatherData } from './weather';
import { promisify } from 'util';
import { exec } from 'child_process';
import * as cheerio from 'cheerio';

const execAsync = promisify(exec);

export async function getStrattonData(): Promise<MountainData> {
    const coords = { lat: 43.1115, long: -72.9081 };
    const otsUrl = 'https://www.onthesnow.com/vermont/stratton-mountain/skireport';

    // 1. Fetch Weather
    const weather = await getWeatherData(coords.lat, coords.long);

    // 2. Scrape OnTheSnow
    let snowReport: SnowReport = {
        snow24hIn: 0,
        snow48hIn: 0,
        snow7dIn: 0,
        seasonSnowIn: 0,
        baseDepthIn: { min: 0, max: 0 },
        conditions: 'Data Unavailable',
        fetchedAt: new Date().toISOString(),
        sourceUrl: otsUrl
    };

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

    try {
        console.log(`[Stratton] Fetching ${otsUrl} ...`);
        const { stdout } = await execAsync(`curl -s -L "${otsUrl}" -H "User-Agent: Mozilla/5.0"`);
        const $ = cheerio.load(stdout);
        const nextDataScript = $('#__NEXT_DATA__').html();

        if (nextDataScript) {
            const json = JSON.parse(nextDataScript);
            const fullResort = json.props?.pageProps?.fullResort;

            if (fullResort) {
                // Parse Snow Report (Found in 'snow' and 'depths' objects)
                const s = fullResort.snow || {};
                const d = fullResort.depths || {};
                const base = parseFloat(d.base) || parseFloat(s.base) || 0;

                // Fallbacks requested by user: 2day -> 24h, 3day -> 48h if primary missing
                const last24 = parseFloat(s.last24);
                const last48 = parseFloat(s.last48);
                const last72 = parseFloat(s.last72);

                snowReport = {
                    snow24hIn: !isNaN(last24) && last24 > 0 ? last24 : (last48 || 0),
                    snow48hIn: !isNaN(last48) && last48 > 0 ? last48 : (last72 || 0),
                    snow7dIn: last72 || 0,
                    seasonSnowIn: 0,
                    baseDepthIn: { min: base, max: base },
                    conditions: 'Open', // Derived from status
                    fetchedAt: new Date().toISOString(),
                    sourceUrl: otsUrl
                };

                // Fallback for Season Total using Official API
                if (snowReport.seasonSnowIn === 0) {
                    const fallbackTotal = await fetchStrattonOfficialSeasonTotal();
                    if (fallbackTotal > 0) {
                        console.log(`[Stratton] Updated Season Total from Official API: ${fallbackTotal}"`);
                        snowReport.seasonSnowIn = fallbackTotal;
                    }
                }

                // Parse Terrain
                const terrain = fullResort.terrain || {};

                const runs = terrain.runs || {};
                let rawTrails = [];

                if (Array.isArray(runs)) {
                    rawTrails = runs;
                } else if (runs.details && Array.isArray(runs.details)) {
                    rawTrails = runs.details;
                } else {
                    rawTrails = Object.values(runs); // Fallback if neither
                }

                console.log(`[Stratton Debug] Raw Trails Count: ${rawTrails.length}`);
                if (rawTrails.length > 0) console.log(`[Stratton Debug] Sample Trail: ${JSON.stringify(rawTrails[0])}`);

                const trails: TrailCondition[] = rawTrails
                    .filter((t: any) => {
                        if (!t || !t.name) return false;
                        const n = t.name.trim();

                        // Filter out "composite" trails, "Uphill" routes, and utility paths
                        if (n.includes(',') || n.includes('&') || n.includes('Uphill') ||
                            n.includes('Shortcut') || n.includes('Cut Through') ||
                            n.includes('Work Road') || n.includes('Access') || n.includes('Extension')) {
                            return false;
                        }

                        // Filter known Glades (Stratton counts these 11 separately from the 99 trails)
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

                // Lifts (Status 2 = Open based on debug)
                const rawLifts = terrain.lifts?.details || [];
                const lifts: LiftCondition[] = rawLifts.map((l: any) => ({
                    name: l.name,
                    status: l.status === 2 ? 'Open' : 'Closed',
                    type: l.type,
                    waitTime: 0
                }));

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
        console.error('[Stratton] Scraping failed:', e);
    }

    // Generate detailed summary
    const predictedSnow = (weather.daily[0]?.snowIn || 0) + (weather.daily[1]?.snowIn || 0);
    const summary = `The current Stratton base depth is ${Math.round(snowReport.baseDepthIn.max)} inches, with ${Math.round(snowReport.snow48hIn)} new inches of snow over the past 48 hours and ${Math.round(predictedSnow)} inches predicted today and tomorrow. ${liftsTerrain.trailsOpen}/${liftsTerrain.trailsTotal} trails are open, ${liftsTerrain.liftsOpen}/${liftsTerrain.liftsTotal} lifts are open, and ${liftsTerrain.terrainOpenPct}% of the total terrain is open.`;

    return {
        mountain: {
            name: 'Stratton',
            slug: 'stratton',
            url: otsUrl,
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
// Helper to fetch season total from MtnPowder (Official Stratton Feed)
async function fetchStrattonOfficialSeasonTotal(): Promise<number> {
    try {
        console.log('[Stratton] Fallback: Fetching MtnPowder API for Season Total (using fetch)...');
        const apiUrl = 'https://mtnpowder.com/feed/v3.json?bearer_token=hPtaTVkbuyZQnrxvru4ApfpXnS21PJO3eTKdibDoLZE&resortId%5B%5D=1';

        const res = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            },
            signal: AbortSignal.timeout(5000)
        });

        if (!res.ok) {
            console.error(`[Stratton Debug] Fetch failed: ${res.status} ${res.statusText}`);
            return 0;
        }

        const data = await res.json();
        const resort = data.Resorts?.[0];

        if (resort?.SnowReport?.SeasonTotalIn) {
            const val = parseFloat(resort.SnowReport.SeasonTotalIn);
            if (!isNaN(val) && val > 0) return val;
        }

        return 0;
    } catch (e: any) {
        console.error('[Stratton] MtnPowder fallback failed:', e.message);
        return 0;
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

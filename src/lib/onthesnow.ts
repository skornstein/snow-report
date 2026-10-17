import { MountainData, SnowReport, LiftsTerrain, LiftCondition, TrailCondition } from './types';
import { getWeatherData } from './weather';
import { ResortInfo } from './resorts';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

// OnTheSnow moved to the Next.js App Router: the resort report is no longer in #__NEXT_DATA__ but in the
// React Server Components payload (self.__next_f.push chunks). Values are METRIC (cm, °C) and get converted.
const CM_TO_IN = 1 / 2.54;

export interface OtsResort {
    title: string;
    reportStatus: number;
    snow: { base: number | null; middle: number | null; summit: number | null; last24: number | null; last48: number | null; last72: number | null };
    status: { openFlag: number; openingDate: string | null; closingDate: string | null };
    terrain: {
        runs: { open: number | null; openPercent: number | null; total: number | null; details: any[] | null };
        lifts: { open: number | null; total: number | null; details: any[] | null };
    };
    recent: { date: string; snow: number }[] | null;
    updatedAt?: string;
}

export async function fetchOtsResort(otsPath: string): Promise<{ resort: OtsResort | null; url: string }> {
    const url = `https://www.onthesnow.com/${otsPath}/skireport`;
    try {
        const { stdout } = await execAsync(`curl -s -L "${url}" -H "User-Agent: Mozilla/5.0"`, { maxBuffer: 20 * 1024 * 1024 });
        return { resort: parseOtsHtml(stdout), url };
    } catch (e) {
        console.error(`[OTS] fetch failed for ${otsPath}`, e);
        return { resort: null, url };
    }
}

export function parseOtsHtml(html: string): OtsResort | null {
    const chunks = [...html.matchAll(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g)];
    if (!chunks.length) return null;
    const flight = Buffer.from(chunks.map(m => JSON.parse(`"${m[1]}"`)).join(''), 'utf-8');
    const rows = parseFlight(flight);
    for (const v of rows.values()) {
        const found = findResort(v);
        if (found) return resolveRefs(found, rows) as OtsResort;
    }
    return null;
}

// RSC rows look like `2b:{...}\n`, `18:T445,<445 bytes of text>`, or `5:I[...]`. "$2b" strings reference rows.
function parseFlight(b: Buffer): Map<string, any> {
    const rows = new Map<string, any>();
    let i = 0;
    const isHex = (c: number) => (c >= 48 && c <= 57) || (c >= 97 && c <= 102);
    while (i < b.length) {
        let j = i;
        while (j < b.length && isHex(b[j])) j++;
        if (j === i || b[j] !== 58 /* : */) {
            const nl = b.indexOf(10, i); i = nl < 0 ? b.length : nl + 1; continue;
        }
        const key = b.subarray(i, j).toString(); i = j + 1;
        if (b[i] === 84 /* T */) {
            const comma = b.indexOf(44, i);
            const len = parseInt(b.subarray(i + 1, comma).toString(), 16);
            rows.set(key, b.subarray(comma + 1, comma + 1 + len).toString('utf-8'));
            i = comma + 1 + len; continue;
        }
        const nl = b.indexOf(10, i); const end = nl < 0 ? b.length : nl;
        const raw = b.subarray(i, end).toString('utf-8'); i = end + 1;
        if (raw[0] === '{' || raw[0] === '[') {
            try { rows.set(key, JSON.parse(raw)); } catch { /* not JSON (e.g. module refs) */ }
        }
    }
    return rows;
}

function findResort(v: any): any {
    if (v && typeof v === 'object') {
        if (!Array.isArray(v) && 'reportStatus' in v && 'terrain' in v) return v;
        for (const x of Object.values(v)) { const r = findResort(x); if (r) return r; }
    }
    return null;
}

function resolveRefs(v: any, rows: Map<string, any>, depth = 0): any {
    if (depth > 40) return v;
    if (typeof v === 'string') {
        const m = /^\$([0-9a-f]+)$/.exec(v);
        return m && rows.has(m[1]) ? resolveRefs(rows.get(m[1]), rows, depth + 1) : v;
    }
    if (Array.isArray(v)) return v.map(x => resolveRefs(x, rows, depth + 1));
    if (v && typeof v === 'object') {
        const out: any = {};
        for (const [k, x] of Object.entries(v)) out[k] = resolveRefs(x, rows, depth + 1);
        return out;
    }
    return v;
}

const inches = (cm: number | null | undefined) => (cm ? Math.round(cm * CM_TO_IN * 10) / 10 : 0);

export function otsLiftsTerrain(r: OtsResort, sourceUrl: string, trailFilter?: (name: string) => boolean): LiftsTerrain {
    const rawTrails = Array.isArray(r.terrain?.runs?.details) ? r.terrain.runs.details : [];
    const rawLifts = Array.isArray(r.terrain?.lifts?.details) ? r.terrain.lifts.details : [];
    const trails: TrailCondition[] = rawTrails
        .filter((t: any) => t?.name && (!trailFilter || trailFilter(String(t.name).trim())))
        .map((t: any) => ({
            name: t.name,
            status: (t.status === 1 || t.status === 'Open') ? 'Open' : 'Closed',
            difficulty: mapDifficulty(t.difficulty),
            isGroomed: t.grooming,
        }));
    const lifts: LiftCondition[] = rawLifts.map((l: any) => ({
        name: l.name,
        status: (l.status === 1 || l.status === 2) ? 'Open' : 'Closed',
        type: l.type,
        waitTime: 0,
    }));
    // In season OTS returns per-trail/lift details; off season only counts (details: null).
    const trailsOpen = trails.length ? trails.filter(t => t.status === 'Open').length : (r.terrain?.runs?.open ?? 0);
    const trailsTotal = trails.length || (r.terrain?.runs?.total ?? 0);
    const liftsOpen = lifts.length ? lifts.filter(l => l.status === 'Open').length : (r.terrain?.lifts?.open ?? 0);
    const liftsTotal = lifts.length || (r.terrain?.lifts?.total ?? 0);
    return {
        liftsOpen, liftsTotal, trailsOpen, trailsTotal,
        terrainOpenPct: trailsTotal > 0 ? Math.round((trailsOpen / trailsTotal) * 100) : 0,
        lifts, trails, sourceUrl, fetchedAt: new Date().toISOString(),
    };
}

export function otsSnowReport(r: OtsResort, sourceUrl: string): SnowReport {
    const recent = r.recent || [];
    const lastDate = recent.length ? new Date(recent[recent.length - 1].date) : null;
    const snow7dCm = lastDate
        ? recent.filter(d => (lastDate.getTime() - new Date(d.date).getTime()) < 7 * 864e5).reduce((s, d) => s + (d.snow || 0), 0)
        : 0;
    const open = r.status?.openFlag === 1 || (r.terrain?.lifts?.open ?? 0) > 0;
    return {
        snow24hIn: inches(r.snow?.last24),
        snow48hIn: inches(r.snow?.last48),
        snow7dIn: inches(snow7dCm),
        baseDepthIn: { min: inches(r.snow?.base), max: inches(r.snow?.summit ?? r.snow?.base) || inches(r.snow?.base) },
        seasonSnowIn: 0, // not published by OnTheSnow; the widget shows "--"
        conditions: open ? 'Open' : 'Closed',
        sourceUrl,
        fetchedAt: new Date().toISOString(),
    };
}

export function buildSummary(name: string, snow: SnowReport, lt: LiftsTerrain, predictedIn: number): string {
    return `The current ${name} base depth is ${Math.round(snow.baseDepthIn.max)} inches, with ${Math.round(snow.snow24hIn)} new inches of snow over the past 24 hours and ${Math.round(predictedIn)} inches predicted today and tomorrow. ${lt.trailsOpen}/${lt.trailsTotal} trails are open, ${lt.liftsOpen}/${lt.liftsTotal} lifts are open, and ${lt.terrainOpenPct}% of the total terrain is open.`;
}

// Generic resort backed entirely by OnTheSnow (Bromley, Magic Mountain, Berkshire East).
export async function getOnTheSnowResortData(info: ResortInfo): Promise<MountainData> {
    const [weather, ots] = await Promise.all([
        getWeatherData(info.coords.lat, info.coords.long),
        fetchOtsResort(info.otsPath!),
    ]);
    const unavailable: SnowReport = {
        snow24hIn: 0, snow48hIn: 0, snow7dIn: 0, baseDepthIn: { min: 0, max: 0 }, seasonSnowIn: 0,
        conditions: 'Data Unavailable', sourceUrl: ots.url, fetchedAt: new Date().toISOString(),
    };
    const snowReport = ots.resort ? otsSnowReport(ots.resort, info.officialUrl) : unavailable;
    const liftsTerrain = ots.resort
        ? otsLiftsTerrain(ots.resort, ots.url)
        : { liftsOpen: 0, liftsTotal: 0, trailsOpen: 0, trailsTotal: 0, terrainOpenPct: 0, lifts: [], trails: [], sourceUrl: ots.url, fetchedAt: new Date().toISOString() };
    const predicted = (weather.daily[0]?.snowIn || 0) + (weather.daily[1]?.snowIn || 0);
    return {
        mountain: { name: info.name, slug: info.slug, url: info.officialUrl, lastUpdated: new Date().toISOString(), location: info.location },
        snowReport, liftsTerrain, weather,
        summary: buildSummary(info.name, snowReport, liftsTerrain, predicted),
        generatedAt: new Date().toISOString(),
    };
}

function mapDifficulty(diff: number): 'green' | 'blue' | 'black' | 'double_black' | undefined {
    switch (diff) {
        case 1: return 'green';
        case 2: return 'blue';
        case 3: return 'black';
        case 4: return 'double_black';
        default: return undefined;
    }
}

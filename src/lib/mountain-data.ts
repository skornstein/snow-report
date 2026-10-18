import { MountainData } from './types';
import { RESORTS_BY_SLUG } from './resorts';
import { getVailResortData } from './vail-resorts';
import { getStrattonData } from './stratton';
import { getOnTheSnowResortData, fetchOtsResort, otsSeason } from './onthesnow';

// Server-side dispatcher: one place that knows which collector serves each resort.
export async function getMountainData(slug: string): Promise<MountainData> {
    const info = RESORTS_BY_SLUG[slug];
    if (!info) throw new Error(`Unknown resort: ${slug}`);
    const data = await collect(slug);
    // A resort-announced opening date beats OnTheSnow's projection.
    const a = info.announcedOpening;
    if (a && data.season && !data.season.isOpen && a.date >= new Date().toISOString().slice(0, 10)) {
        data.season = { ...data.season, openingDate: a.date, source: `Resort announcement: ${a.source}`, projected: false };
    }
    return data;
}

async function collect(slug: string): Promise<MountainData> {
    const info = RESORTS_BY_SLUG[slug];
    switch (info.source) {
        case 'vail': {
            const [data, ots] = await Promise.all([
                getVailResortData(slug),
                info.otsPath ? fetchOtsResort(info.otsPath) : Promise.resolve({ resort: null, url: '' }),
            ]);
            return ots.resort ? { ...data, season: otsSeason(ots.resort) } : data;
        }
        case 'stratton': return getStrattonData();
        case 'onthesnow': return getOnTheSnowResortData(info);
    }
}

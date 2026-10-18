import { MountainData } from './types';
import { RESORTS_BY_SLUG } from './resorts';
import { getVailResortData } from './vail-resorts';
import { getStrattonData } from './stratton';
import { getOnTheSnowResortData, fetchOtsResort, otsSeason } from './onthesnow';

// Server-side dispatcher: one place that knows which collector serves each resort.
export async function getMountainData(slug: string): Promise<MountainData> {
    const info = RESORTS_BY_SLUG[slug];
    if (!info) throw new Error(`Unknown resort: ${slug}`);
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

import { NextResponse } from 'next/server';
import { getCachedData } from '@/lib/cache';
import { RESORT_LIST } from '@/lib/resorts';
import { getMountainData } from '@/lib/mountain-data';

export const dynamic = 'force-dynamic';

const CACHE_TTL = 15 * 60;

// All resorts in one response (drive-time order) for valleyviewvt.com's server-rendered conditions block.
export async function GET() {
    const results = await Promise.all(RESORT_LIST.map(async r => {
        try {
            const data = await getCachedData(`mountain_data_${r.slug}`, CACHE_TTL, () => getMountainData(r.slug));
            return { slug: r.slug, name: r.name, location: r.location, driveMin: r.driveMin, officialUrl: r.officialUrl, data };
        } catch (e) {
            console.error(`[report] ${r.slug} failed`, e);
            return { slug: r.slug, name: r.name, location: r.location, driveMin: r.driveMin, officialUrl: r.officialUrl, data: null };
        }
    }));
    return NextResponse.json({ generatedAt: new Date().toISOString(), resorts: results });
}

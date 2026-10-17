import { NextRequest, NextResponse } from 'next/server';
import { getCachedData } from '@/lib/cache';
import { RESORTS_BY_SLUG } from '@/lib/resorts';
import { getMountainData } from '@/lib/mountain-data';

export const dynamic = 'force-dynamic';

// Cache TTL: 15 minutes (in seconds)
const CACHE_TTL = 15 * 60;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug') || 'mount-snow';

    try {
        let data;

        const resolved = RESORTS_BY_SLUG[slug] ? slug : 'mount-snow';
        data = await getCachedData(`mountain_data_${resolved}`, CACHE_TTL, () => getMountainData(resolved));

        return NextResponse.json(data);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch mountain data' }, { status: 500 });
    }
}

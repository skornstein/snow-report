import { NextRequest, NextResponse } from 'next/server';
import { getVailResortData } from '@/lib/vail-resorts';
import { getStrattonData } from '@/lib/stratton';
import { getCachedData } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// Cache TTL: 15 minutes (in seconds)
const CACHE_TTL = 15 * 60;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug') || 'mount-snow';

    try {
        let data;
        const cacheKey = `mountain_data_${slug}`;

        data = await getCachedData(cacheKey, CACHE_TTL, async () => {
            switch (slug) {
                case 'okemo':
                    return await getVailResortData('okemo');
                case 'stratton':
                    return await getStrattonData();
                case 'mount-snow':
                default:
                    return await getVailResortData('mount-snow');
            }
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch mountain data' }, { status: 500 });
    }
}

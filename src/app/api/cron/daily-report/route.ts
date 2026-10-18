import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';
import { generateSingleResortEmail, generateGenMultiResortEmail } from '@/lib/email-templates';
import { MountainData } from '@/lib/types';
import { RESORT_LIST } from '@/lib/resorts';
import { getMountainData } from '@/lib/mountain-data';
import { unsubscribeUrl } from '@/lib/unsubscribe';

export const dynamic = 'force-dynamic'; // Prevent static caching of the cron route

export async function GET(request: Request) {
    try {
        // 1. Authorization
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        console.log('[CRON] Starting Daily Snow Report...');

        if (!supabase) {
            console.log('[CRON] Supabase not configured. Skipping execution.');
            return NextResponse.json({ success: true, message: 'Skipped (No Supabase)' });
        }

        // 2. Fetch Mountain Data (Parallel)
        console.log('[CRON] Fetching Mountain Data...');
        const results = await Promise.all(RESORT_LIST.map(r => getMountainData(r.slug).catch(() => null)));
        const dataMap: Record<string, MountainData | null> =
            Object.fromEntries(RESORT_LIST.map((r, i) => [r.slug, results[i]]));

        // 3. Query Active Subscribers
        // Logic: Find users where today is >= start_date AND today <= end_date
        const today = new Date().toISOString().split('T')[0];

        const { data: subscribers, error } = await supabase
            .from('subscribers')
            .select('*')
            .lte('start_date', today)
            .gte('end_date', today);

        if (error) throw error;

        console.log(`[CRON] Found ${subscribers?.length || 0} active subscribers for ${today}`);

        if (!subscribers || subscribers.length === 0) {
            return NextResponse.json({ success: true, message: 'No active subscribers today.' });
        }

        // 4. Send Emails
        let sentCount = 0;
        let failCount = 0;

        for (const sub of subscribers) {
            const userResorts = sub.resorts || [];
            if (userResorts.length === 0) continue;

            try {
                // Determine Email Type
                if (userResorts.length === 1) {
                    // Single Resort Email
                    const resortSlug = userResorts[0];
                    const resortData = dataMap[resortSlug];

                    if (resortData) {
                        const html = generateSingleResortEmail(resortData, unsubscribeUrl(sub.email));
                        const subject = `🏔️ ${resortData.mountain.name} Report: ${resortData.snowReport.snow24hIn}" New Snow!`;
                        await sendEmail({ to: sub.email, subject, html });
                        sentCount++;
                    }
                } else {
                    // Multi Resort (Digest)
                    const relevantData = userResorts
                        .map((slug: string) => dataMap[slug])
                        .filter((d: MountainData | null): d is MountainData => d !== null);

                    if (relevantData.length > 0) {
                        // Neutral Subject Line
                        const names = relevantData.map((d: MountainData) => d.mountain.name).join(', ');
                        const subject = `❄️ Daily Snow Report: ${names}`;

                        const html = generateGenMultiResortEmail(relevantData, unsubscribeUrl(sub.email));
                        await sendEmail({ to: sub.email, subject, html });
                        sentCount++;
                    }
                }
            } catch (e) {
                console.error(`[CRON] Failed to send email to ${sub.email}`, e);
                failCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${subscribers.length} subscribers`,
            stats: { sent: sentCount, failed: failCount }
        });

    } catch (error: any) {
        console.error('[CRON] Critical Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

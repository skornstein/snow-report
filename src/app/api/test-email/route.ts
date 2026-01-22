import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { supabase } from '@/lib/supabase';

// FORCE DYNAMIC: Ensure this route is never cached
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const targetEmail = searchParams.get('email');
    const secret = searchParams.get('secret');

    // 1. Basic Secret Check
    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ success: false, error: 'Invalid Secret' }, { status: 401 });
    }

    if (!targetEmail) {
        return NextResponse.json({ success: false, error: 'Missing email param' }, { status: 400 });
    }

    const logs: string[] = [];
    const log = (msg: string) => logs.push(`[${new Date().toISOString()}] ${msg}`);

    try {
        log('Starting Debug Sequence...');

        // 2. Check Environment Variables
        log(`Supabase URL Configured: ${!!process.env.NEXT_PUBLIC_SUPABASE_URL}`);
        log(`Supabase Key Configured: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);
        log(`Resend Key Configured: ${!!process.env.RESEND_API_KEY}`);

        // 3. Test Supabase Connection
        let supabaseStatus = 'SKIPPED';
        if (supabase) {
            log('Testing Supabase Connection...');
            const { data, error } = await supabase.from('subscribers').select('count', { count: 'exact', head: true });
            if (error) {
                log(`Supabase Error: ${error.message}`);
                supabaseStatus = 'FAILED';
            } else {
                log(`Supabase Connection Success. Total Rows: ${data}`); // data is null for head:true but count is in count
                supabaseStatus = 'SUCCESS';
            }
        } else {
            log('Supabase Client is NULL');
        }

        // 4. Test Resend (Direct Send)
        log(`Attempting to send email to: ${targetEmail}`);
        const result = await sendEmail({
            to: targetEmail,
            subject: 'Debug Test: Snow Report Widget',
            html: '<h1>It Works!</h1><p>This is a test email primarily to verify Resend configuration.</p>'
        });

        if (result.success) {
            log(`Email Request Sent via Resend. ID: ${result.id}`);
        } else {
            log(`Resend Failed: ${JSON.stringify(result.error)}`);
        }

        return NextResponse.json({
            success: true,
            emailStatus: result.success ? 'SENT' : 'FAILED',
            supabaseStatus,
            logs
        });

    } catch (error: any) {
        log(`CRITICAL FAILURE: ${error.message}`);
        return NextResponse.json({ success: false, error: error.message, logs }, { status: 500 });
    }
}

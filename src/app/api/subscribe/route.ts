import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';
import { generateSubscriptionConfirmationEmail } from '@/lib/email-templates';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const { email, resorts, startDate, endDate, time } = body;

        if (!supabase) {
            console.error('Supabase client not initialized. Check env vars.');
            // Fallback for demo/dev without keys
            await new Promise(resolve => setTimeout(resolve, 800));
            return NextResponse.json({ success: true, message: 'Subscribed (Mock Mode)' });
        }

        const { error } = await supabase
            .from('subscribers')
            .upsert({
                email,
                resorts,
                start_date: startDate,
                end_date: endDate
            }, { onConflict: 'email' });

        if (error) {
            console.error('Supabase Error:', error);
            throw error;
        }

        // Send Confirmation Email
        try {
            const html = generateSubscriptionConfirmationEmail(resorts, startDate, endDate);
            await sendEmail({
                to: email,
                subject: 'Subscription Confirmed ✔',
                html
            });
        } catch (emailError) {
            console.error('Failed to send confirmation email', emailError);
            // Don't fail the request if email fails, but log it
        }

        return NextResponse.json({ success: true, message: 'Subscribed successfully!' });
    } catch (error) {
        console.error('Subscription API Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to subscribe' }, { status: 500 });
    }
}

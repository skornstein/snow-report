import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, duration, time } = body;

        // In a real app, this would save to a database or trigger an email service
        console.log('Subscription Request:', { email, duration, time });

        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 800));

        return NextResponse.json({ success: true, message: 'Subscribed successfully!' });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to subscribe' }, { status: 500 });
    }
}

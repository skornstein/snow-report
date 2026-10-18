import { supabase } from '@/lib/supabase';
import { verifyUnsubscribeToken } from '@/lib/unsubscribe';

export const dynamic = 'force-dynamic';

// GET  = link click from the email footer -> confirmation page with a button (link scanners prefetch GETs, so GET never deletes).
// POST = the button, or an RFC 8058 one-click request from the mailbox provider -> delete the subscriber.

function escapeHtml(s: string): string {
    return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function page(title: string, body: string, status = 200): Response {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>${title} | Valley View Villa: Snow Report</title>
    <link rel="icon" href="https://www.valleyviewvt.com/wp-content/uploads/2024/10/cropped-4-192x192.png">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; background-color: #f8fafc; margin: 0; padding: 80px 16px; line-height: 1.5; }
        .card { max-width: 448px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 32px; text-align: center; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); border: 1px solid #f1f5f9; }
        .logo { height: 48px; width: auto; margin-bottom: 8px; }
        .brand { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: -0.01em; color: #64748b; margin-bottom: 24px; }
        .icon { display: inline-block; border-radius: 9999px; padding: 16px; margin-bottom: 16px; font-size: 28px; line-height: 1; font-weight: 700; }
        .ok { background-color: #dcfce7; color: #16a34a; }
        .err { background-color: #fee2e2; color: #dc2626; }
        h1 { font-size: 20px; font-weight: 700; margin: 0 0 8px; }
        p { color: #64748b; margin: 0 0 24px; }
        button, .btn { display: block; width: 100%; box-sizing: border-box; border: 0; border-radius: 12px; padding: 12px; font-size: 16px; font-weight: 700; cursor: pointer; text-decoration: none; font-family: inherit; }
        .primary { background-color: #2563eb; color: #ffffff; }
        .primary:hover { background-color: #1d4ed8; }
        .secondary { background-color: #f1f5f9; color: #0f172a; }
        .secondary:hover { background-color: #e2e8f0; }
    </style>
</head>
<body>
    <div class="card">
        <img class="logo" src="https://i0.wp.com/valleyviewvt.com/wp-content/uploads/2024/10/Valley_View_Villa_Logo_Grey_White_Circle_Transparent_Background-768x635.png" alt="Valley View Villa">
        <div class="brand">Valley View Villa · Snow Report</div>
        ${body}
    </div>
</body>
</html>`;
    return new Response(html, {
        status,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
    });
}

const invalidLink = () => page('Invalid Link', `
        <div class="icon err">!</div>
        <h1>This link isn't valid</h1>
        <p>The unsubscribe link is incomplete or has been altered. Use the Unsubscribe link at the bottom of your most recent snow report email.</p>
        <a class="btn secondary" href="https://www.valleyviewvt.com/snow-report/">Back to the Snow Report</a>`, 400);

const serverError = () => page('Error', `
        <div class="icon err">!</div>
        <h1>Something went wrong</h1>
        <p>We couldn't process your request. Please try again in a few minutes.</p>`, 500);

function readParams(request: Request): { email: string; token: string } | null {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const token = searchParams.get('token');
    if (!email || !token || !/^[0-9a-f]{64}$/.test(token)) return null;
    return verifyUnsubscribeToken(email, token) ? { email, token } : null;
}

export async function GET(request: Request) {
    const params = readParams(request);
    if (!params) return invalidLink();

    const action = `/api/unsubscribe?${new URLSearchParams(params).toString()}`;
    return page('Unsubscribe', `
        <h1>Unsubscribe from snow reports?</h1>
        <p>We'll stop sending daily snow report emails to <strong>${escapeHtml(params.email)}</strong>.</p>
        <form method="POST" action="${escapeHtml(action)}">
            <button type="submit" class="primary">Unsubscribe</button>
        </form>`);
}

export async function POST(request: Request) {
    const params = readParams(request);
    if (!params) return invalidLink();

    if (!supabase) {
        console.error('[UNSUBSCRIBE] Supabase client not initialized.');
        return serverError();
    }

    const { error } = await supabase.from('subscribers').delete().eq('email', params.email);
    if (error) {
        console.error('[UNSUBSCRIBE] Supabase Error:', error);
        return serverError();
    }

    console.log('[UNSUBSCRIBE] Removed subscriber');
    return page('Unsubscribed', `
        <div class="icon ok">✓</div>
        <h1>You're unsubscribed</h1>
        <p><strong>${escapeHtml(params.email)}</strong> will no longer receive daily snow report emails. You can resubscribe anytime from the snow report.</p>
        <a class="btn secondary" href="https://www.valleyviewvt.com/snow-report/">Back to the Snow Report</a>`);
}

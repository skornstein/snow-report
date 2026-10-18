import { createHmac, timingSafeEqual } from 'crypto';

const SITE_URL = 'https://snow-report-delta.vercel.app';

function getSecret(): string {
    const secret = process.env.UNSUBSCRIBE_SECRET;
    if (!secret) throw new Error('UNSUBSCRIBE_SECRET is not set');
    return secret;
}

// Stateless token: HMAC of the exact stored email, so no DB column is needed and links never expire.
export function unsubscribeToken(email: string): string {
    return createHmac('sha256', getSecret()).update(email).digest('hex');
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
    const expected = Buffer.from(unsubscribeToken(email), 'hex');
    const given = Buffer.from(token, 'hex');
    return given.length === expected.length && timingSafeEqual(given, expected);
}

export function unsubscribeUrl(email: string): string {
    const params = new URLSearchParams({ email, token: unsubscribeToken(email) });
    return `${SITE_URL}/api/unsubscribe?${params.toString()}`;
}

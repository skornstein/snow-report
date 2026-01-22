import { Resend } from 'resend';

const resendKey = process.env.RESEND_API_KEY!;

export const resend = resendKey ? new Resend(resendKey) : null;

export async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
    if (!resend) {
        console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
        return { success: true, id: 'mock-id' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'Snow Report <report@updates.valleyviewvt.com>', // Must match verified subdomain
            to,
            subject,
            html,
        });

        if (error) {
            console.error('Resend API Returned Error:', error);
            return { success: false, error };
        }

        return { success: true, id: data?.id };
    } catch (error) {
        console.error('Resend Network/SDK Error:', error);
        return { success: false, error };
    }
}

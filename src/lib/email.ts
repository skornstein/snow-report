import { Resend } from 'resend';

const resendKey = process.env.RESEND_API_KEY!;

export const resend = resendKey ? new Resend(resendKey) : null;

export async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
    if (!resend) {
        console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
        return { success: true, id: 'mock-id' };
    }

    try {
        const data = await resend.emails.send({
            from: 'Snow Report <updates@valleyviewvt.com>', // Requires verified domain
            to,
            subject,
            html,
        });
        return { success: true, id: data.data?.id };
    } catch (error) {
        console.error('Resend Error:', error);
        return { success: false, error };
    }
}

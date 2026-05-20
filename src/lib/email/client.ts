import { Resend } from 'resend';

let resend: Resend | null = null;

function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendEmail({
  to,
  subject,
  html,
  from = 'Leaex <bookings@support.leaex.com>',
}: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] Skipping email send: RESEND_API_KEY is not set.');
    return;
  }

  try {
    const client = getResend();
    if (!client) throw new Error('Resend client not initialized');

    const { data, error } = await client.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[Email] Resend error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('[Email] Unexpected error:', err);
    return { success: false, error: err };
  }
}

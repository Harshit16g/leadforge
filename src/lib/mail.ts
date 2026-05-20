import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends a staff invitation email via Resend.
 */
export async function sendStaffInvitation({
  email,
  name,
  inviteLink,
}: {
  email: string;
  name: string;
  inviteLink: string;
}) {
  const { data, error } = await resend.emails.send({
    from: "Leaex <onboarding@leaex.com>", // In production, this should be a verified domain
    to: [email],
    subject: "Welcome to the Team! Set up your Leaex account",
    html: `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #1a1a1a; background-color: #ffffff; border-radius: 24px; border: 1px solid #e5e7eb;">
        <div style="margin-bottom: 32px;">
          <h1 style="font-size: 28px; font-weight: 900; margin: 0; color: #000000; letter-spacing: -0.02em;">Leaex</h1>
        </div>
        
        <h2 style="font-size: 24px; font-weight: 800; margin-bottom: 16px; color: #111827;">Hello ${name},</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
          You've been added to the team at <strong>Leaex</strong>. We're excited to have you on board!
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 32px;">
          To get started, please click the button below to set your password and access your dashboard.
        </p>
        
        <a href="${inviteLink}" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 16px 32px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; transition: background-color 0.2s;">
          Setup Your Account
        </a>
        
        <div style="margin-top: 48px; padding-top: 32px; border-top: 1px solid #f3f4f6;">
          <p style="font-size: 12px; color: #9ca3af; line-height: 1.6; margin: 0;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
          <p style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
            &copy; ${new Date().getFullYear()} Leaex. All rights reserved.
          </p>
        </div>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send invitation email:", error);
    throw error;
  }

  return data;
}

/**
 * Sends a welcome email with credentials for pre-created accounts.
 */
export async function sendStaffWelcome({
  email,
  name,
  password,
  loginUrl,
}: {
  email: string;
  name: string;
  password?: string;
  loginUrl: string;
}) {
  const { data, error } = await resend.emails.send({
    from: "Leaex <onboarding@leaex.com>",
    to: [email],
    subject: "Welcome to the Team! Your Leaex Login Details",
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #1a1a1a; background-color: #ffffff; border-radius: 24px; border: 1px solid #e5e7eb;">
        <h1 style="font-size: 28px; font-weight: 900; margin-bottom: 24px; color: #000000;">Leaex</h1>
        <h2 style="font-size: 24px; font-weight: 800; margin-bottom: 16px;">Hello ${name},</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">You've been officially added to the team on Leaex.</p>
        
        ${password ? `
        <div style="background-color: #f9fafb; padding: 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #f3f4f6;">
          <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Your Login Credentials</p>
          <div style="margin-top: 16px;">
            <p style="margin: 8px 0; font-size: 16px;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>Password:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${password}</code></p>
          </div>
        </div>
        <p style="font-size: 14px; color: #ef4444; font-weight: 600;">Please change your password immediately after logging in for security.</p>
        ` : `<p style="font-size: 16px; line-height: 1.6; color: #4b5563;">You can now log in using your existing account credentials.</p>`}

        <a href="${loginUrl}" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 16px 32px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 14px; margin-top: 24px;">
          Access Dashboard
        </a>
      </div>
    `,
  });

  if (error) throw error;
  return data;
}

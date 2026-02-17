import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvitationEmail({
  to,
  inviterName,
  organizationName,
  inviteLink,
}: {
  to: string;
  inviterName: string;
  organizationName: string;
  inviteLink: string;
}) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "Paintr <onboarding@resend.dev>",
    to,
    subject: `You've been invited to ${organizationName} on Paintr`,
    html: `
      <h2>Team Invitation</h2>
      <p>${inviterName} invited you to join <strong>${organizationName}</strong> on Paintr.</p>
      <p><a href="${inviteLink}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:6px;">Accept Invitation</a></p>
      <p>Or copy this link: ${inviteLink}</p>
    `,
  });
}

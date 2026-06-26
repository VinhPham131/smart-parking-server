export const forgotPasswordTemplate = (passwordResetToken: string) => {
  const baseUrl = process.env.FRONTEND_URL ?? '';
  const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(passwordResetToken)}`;
  const accent = '#b8ff5a';
  const bg = '#0f1218';
  const card = '#171b24';
  const muted = '#9ca3af';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background-color:${bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${bg};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background-color:${card};border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.45);">
          <tr>
            <td style="padding:32px 28px 24px 28px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${accent};">VP Smart Parking System</p>
              <h1 style="margin:12px 0 0 0;font-size:22px;font-weight:700;line-height:1.3;color:#f9fafb;">Password reset request</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 8px 28px;">
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#e5e7eb;">
                We received a request to reset the password for your account. Use the button below to choose a new password.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px 0;">
                <tr>
                  <td style="border-radius:12px;background:${accent};">
                    <a href="${resetUrl}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:600;color:#111827;text-decoration:none;border-radius:12px;">
                      Reset password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px 0;font-size:13px;line-height:1.5;color:${muted};">
                If the button does not work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px 0;font-size:12px;line-height:1.5;word-break:break-all;color:${accent};">
                ${resetUrl}
              </p>
              <p style="margin:0;font-size:13px;line-height:1.6;color:${muted};">
                This link expires in a few minutes for your security. If you did not ask for a reset, you can ignore this message and your password will stay the same.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px 28px;background:rgba(0,0,0,0.2);">
              <p style="margin:0;font-size:12px;line-height:1.5;color:${muted};">
                This is an automated message. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

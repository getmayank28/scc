export interface EmailTemplate {
  templateId: string;
  subject: (params: { firstName: string }) => string;
  html: (params: { firstName: string }) => string;
}

const fisenseLaunchEmail: EmailTemplate = {
  templateId: "fisense_launch_email",
  subject: () => "FiSense is live — your early access is ready 🚀",
  html: ({ firstName }) => `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FiSense is live</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f5f7fb; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#f5f7fb" style="background-color:#f5f7fb;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px; width:100%; background-color:#ffffff; border-radius:12px; overflow:hidden;">
            <tr>
              <td align="center" style="padding:32px 24px 8px 24px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="font-size:22px; font-weight:bold; color:#1a73e8; font-family:Arial, Helvetica, sans-serif;">
                      FiSense
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0 32px; font-family:Arial, Helvetica, sans-serif; color:#1f2937; font-size:16px; line-height:1.5;">
                Hi ${firstName} 👋
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0 32px; font-family:Arial, Helvetica, sans-serif; color:#111827; font-size:20px; line-height:1.4; font-weight:bold;">
                FiSense is live — and you're in early. 🚀
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0 32px; font-family:Arial, Helvetica, sans-serif; color:#374151; font-size:15px; line-height:1.6;">
                Most credit card users earn under <strong>1.5%</strong> on their spend. FiSense helps you get <strong>5%+</strong> on the exact same purchases.
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0 32px; font-family:Arial, Helvetica, sans-serif; color:#374151; font-size:15px; line-height:1.6;">
                We show you:
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td valign="top" width="20" style="font-family:Arial, Helvetica, sans-serif; color:#1a73e8; font-size:15px; line-height:1.6; padding:4px 8px 0 0;">•</td>
                    <td style="font-family:Arial, Helvetica, sans-serif; color:#374151; font-size:15px; line-height:1.6; padding:4px 0;">Which card to swipe</td>
                  </tr>
                  <tr>
                    <td valign="top" width="20" style="font-family:Arial, Helvetica, sans-serif; color:#1a73e8; font-size:15px; line-height:1.6; padding:4px 8px 0 0;">•</td>
                    <td style="font-family:Arial, Helvetica, sans-serif; color:#374151; font-size:15px; line-height:1.6; padding:4px 0;">Whether to pay direct, via voucher, or through a portal</td>
                  </tr>
                  <tr>
                    <td valign="top" width="20" style="font-family:Arial, Helvetica, sans-serif; color:#1a73e8; font-size:15px; line-height:1.6; padding:4px 8px 0 0;">•</td>
                    <td style="font-family:Arial, Helvetica, sans-serif; color:#374151; font-size:15px; line-height:1.6; padding:4px 0;">The exact method to maximise every rupee</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0 32px; font-family:Arial, Helvetica, sans-serif; color:#374151; font-size:15px; line-height:1.6;">
                You're on our early access list, so you get <strong>full premium access — free.</strong>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:28px 32px 8px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" bgcolor="#1a73e8" style="border-radius:8px;">
                      <a href="https://www.gofisense.com" target="_blank" style="display:inline-block; padding:14px 28px; font-family:Arial, Helvetica, sans-serif; font-size:16px; font-weight:bold; color:#ffffff; text-decoration:none; border-radius:8px;">
                        👉 Start earning more
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:8px 32px 32px 32px; font-family:Arial, Helvetica, sans-serif; color:#6b7280; font-size:13px; line-height:1.6;">
                <a href="https://www.gofisense.com" target="_blank" style="color:#1a73e8; text-decoration:none;">www.gofisense.com</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="border-top:1px solid #e5e7eb; font-size:0; line-height:0;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 32px 32px 32px; font-family:Arial, Helvetica, sans-serif; color:#9ca3af; font-size:12px; line-height:1.6;">
                You received this email because you joined the FiSense waitlist.<br />
                Questions? Reach us at <a href="mailto:support@gofisense.com" style="color:#1a73e8; text-decoration:none;">support@gofisense.com</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
};

const REGISTRY: Record<string, EmailTemplate> = {
  [fisenseLaunchEmail.templateId]: fisenseLaunchEmail,
};

export function getEmailTemplate(templateId: string): EmailTemplate | null {
  return REGISTRY[templateId] ?? null;
}

export function listEmailTemplateIds(): string[] {
  return Object.keys(REGISTRY);
}

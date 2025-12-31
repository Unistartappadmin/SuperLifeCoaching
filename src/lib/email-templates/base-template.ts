/**
 * Base email template with premium branding
 * Provides consistent layout and styling for all emails
 */

interface BaseTemplateOptions {
  title: string;
  preheader?: string;
  content: string;
}

export function generateBaseEmailTemplate({ title, preheader, content }: BaseTemplateOptions): string {
  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>

  <!--[if mso]>
  <style>
    * { font-family: sans-serif !important; }
  </style>
  <![endif]-->

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f9fafb;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    table {
      border-collapse: collapse;
      border-spacing: 0;
    }

    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      max-width: 100%;
    }

    .email-container {
      max-width: 600px;
      margin: 0 auto;
    }

    .email-header {
      background: linear-gradient(135deg, #0A0A0A 0%, #1a1a1a 100%);
      padding: 40px 30px;
      text-align: center;
    }

    .email-logo {
      font-size: 32px;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: -0.5px;
      margin: 0;
    }

    .email-logo-accent {
      color: #D4AF37;
      font-size: 20px;
      vertical-align: super;
    }

    .email-tagline {
      color: #9ca3af;
      font-size: 13px;
      margin-top: 8px;
      letter-spacing: 0.5px;
    }

    .email-body {
      background-color: #FFFFFF;
      padding: 50px 40px;
    }

    .email-footer {
      background-color: #f9fafb;
      padding: 40px 40px 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }

    .footer-links {
      margin: 20px 0;
    }

    .footer-link {
      color: #6b7280;
      text-decoration: none;
      margin: 0 12px;
      font-size: 13px;
    }

    .footer-link:hover {
      color: #D4AF37;
    }

    .footer-text {
      color: #9ca3af;
      font-size: 12px;
      line-height: 1.5;
      margin-top: 20px;
    }

    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #D4AF37 0%, #C5A028 100%);
      color: #FFFFFF !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      margin: 20px 0;
      box-shadow: 0 4px 6px rgba(212, 175, 55, 0.25);
    }

    .button:hover {
      background: linear-gradient(135deg, #C5A028 0%, #B69121 100%);
    }

    h1 {
      font-size: 28px;
      font-weight: 700;
      color: #0A0A0A;
      margin-bottom: 20px;
      line-height: 1.3;
    }

    h2 {
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
      margin: 30px 0 15px;
    }

    p {
      color: #4b5563;
      margin-bottom: 16px;
      font-size: 15px;
    }

    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #e5e7eb, transparent);
      margin: 30px 0;
    }

    .info-box {
      background-color: #f9fafb;
      border-left: 4px solid #D4AF37;
      padding: 20px;
      margin: 25px 0;
      border-radius: 4px;
    }

    .info-box-title {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 10px;
      font-size: 15px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      color: #6b7280;
      font-size: 14px;
    }

    .info-value {
      color: #1f2937;
      font-weight: 600;
      font-size: 14px;
    }

    @media only screen and (max-width: 600px) {
      .email-header {
        padding: 30px 20px;
      }

      .email-body {
        padding: 30px 20px;
      }

      .email-footer {
        padding: 30px 20px;
      }

      h1 {
        font-size: 24px;
      }

      .button {
        display: block;
        text-align: center;
      }
    }
  </style>
</head>

<body>
  ${preheader ? `
  <!-- Preview text (hidden) -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${preheader}
  </div>
  ` : ''}

  <div class="email-container">
    <!-- Header -->
    <table role="presentation" width="100%">
      <tr>
        <td class="email-header">
          <h1 class="email-logo">
            SuperLife<span class="email-logo-accent">®</span>
          </h1>
          <p class="email-tagline">PREMIUM LIFE COACHING</p>
        </td>
      </tr>
    </table>

    <!-- Body -->
    <table role="presentation" width="100%">
      <tr>
        <td class="email-body">
          ${content}
        </td>
      </tr>
    </table>

    <!-- Footer -->
    <table role="presentation" width="100%">
      <tr>
        <td class="email-footer">
          <div class="footer-links">
            <a href="https://superlifecoaching.uk" class="footer-link">Website</a>
            <a href="https://superlifecoaching.uk/services" class="footer-link">Services</a>
            <a href="https://superlifecoaching.uk/booking" class="footer-link">Book Now</a>
            <a href="https://superlifecoaching.uk/contact" class="footer-link">Contact</a>
          </div>

          <div class="footer-text">
            <p>SuperLife Coaching<br>
            Premium Life Coaching Services<br>
            United Kingdom</p>

            <p style="margin-top: 15px;">
              © ${new Date().getFullYear()} SuperLife Coaching. All rights reserved.
            </p>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `.trim();
}

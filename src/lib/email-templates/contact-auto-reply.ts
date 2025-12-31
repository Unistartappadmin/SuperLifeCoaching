import { generateBaseEmailTemplate } from "./base-template";

interface ContactAutoReplyData {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export function generateContactAutoReply(data: ContactAutoReplyData): string {
  const { name, subject } = data;

  const content = `
    <h1>Thank You for Reaching Out! ✨</h1>

    <p>Dear ${name},</p>

    <p>Thank you for contacting SuperLife Coaching. We've received your message and truly appreciate you taking the time to reach out to us.</p>

    <div class="info-box" style="background-color: #fef3c7; border-left-color: #D4AF37;">
      <div class="info-box-title">📬 Your Message Has Been Received</div>
      ${subject ? `
      <p style="margin: 10px 0 0; color: #4b5563; font-size: 14px;">
        <strong>Subject:</strong> ${subject}
      </p>
      ` : ''}
      <p style="margin: 10px 0 0; color: #4b5563; font-size: 14px;">
        Our team will review your inquiry and respond within 24 hours during business hours.
      </p>
    </div>

    <div class="divider"></div>

    <h2>What Happens Next?</h2>

    <p><strong>1. We Review Your Message</strong><br>
    Our coaching team will carefully read your inquiry and prepare a personalized response tailored to your specific needs.</p>

    <p><strong>2. Expect a Response Soon</strong><br>
    You can expect to hear from us within 24 hours. For urgent matters, please don't hesitate to call us directly.</p>

    <p><strong>3. In the Meantime...</strong><br>
    Feel free to explore our services and discover how we can support your personal growth journey.</p>

    <div class="divider"></div>

    <h2>Explore Our Services</h2>

    <p>While you wait, why not learn more about how SuperLife Coaching can help you achieve your goals?</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://superlifecoaching.uk/services" class="button">
        Explore Our Services
      </a>
    </div>

    <div class="info-box">
      <div class="info-box-title">📞 Need Immediate Assistance?</div>
      <p style="margin: 10px 0 0; color: #4b5563; font-size: 14px;">
        <strong>Email:</strong> <a href="mailto:hello@superlifecoaching.uk" style="color: #D4AF37; text-decoration: none;">hello@superlifecoaching.uk</a><br>
        <strong>Phone:</strong> Available during business hours<br>
        <strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM GMT
      </p>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      We're here to support you on your journey to excellence. Your transformation begins with a single conversation.
    </p>

    <p style="color: #1f2937; font-weight: 600; margin-top: 25px;">
      With gratitude,<br>
      <span style="color: #D4AF37;">The SuperLife Coaching Team</span>
    </p>

    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; font-style: italic;">
      This is an automated response confirming receipt of your message. A member of our team will be in touch with you personally very soon.
    </p>
  `;

  return generateBaseEmailTemplate({
    title: "We've Received Your Message - SuperLife Coaching",
    preheader: "Thank you for contacting us. We'll respond within 24 hours.",
    content,
  });
}

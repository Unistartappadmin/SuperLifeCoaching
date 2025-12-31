import { generateBaseEmailTemplate } from "./base-template";
import { format } from "date-fns";

interface ContactAdminNotificationData {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  submittedAt?: Date;
}

export function generateContactAdminNotification(data: ContactAdminNotificationData): string {
  const {
    name,
    email,
    phone,
    subject,
    message,
    submittedAt = new Date(),
  } = data;

  const timestamp = format(submittedAt, "HH:mm:ss");
  const fullTimestamp = format(submittedAt, "yyyy-MM-dd HH:mm:ss");

  const content = `
    <h1>📨 New Contact Form Submission</h1>

    <p>You have received a new inquiry through your SuperLife Coaching website contact form.</p>

    <div class="info-box" style="background-color: #fef3c7; border-left-color: #D4AF37;">
      <div class="info-box-title">⏰ Received at ${timestamp}</div>
      <p style="margin: 5px 0 0; color: #6b7280; font-size: 13px;">
        Please respond within 24 hours to maintain premium service standards.
      </p>
    </div>

    <div class="info-box">
      <div class="info-box-title">👤 Contact Information</div>
      <div class="info-row">
        <span class="info-label">Name</span>
        <span class="info-value">${name}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email</span>
        <span class="info-value">
          <a href="mailto:${email}" style="color: #D4AF37; text-decoration: none;">${email}</a>
        </span>
      </div>
      ${phone ? `
      <div class="info-row">
        <span class="info-label">Phone</span>
        <span class="info-value">
          <a href="tel:${phone}" style="color: #D4AF37; text-decoration: none;">${phone}</a>
        </span>
      </div>
      ` : ''}
      ${subject ? `
      <div class="info-row">
        <span class="info-label">Subject</span>
        <span class="info-value">${subject}</span>
      </div>
      ` : ''}
    </div>

    <div class="info-box">
      <div class="info-box-title">💬 Message</div>
      <div style="margin-top: 15px; padding: 15px; background-color: white; border-radius: 6px; border: 1px solid #e5e7eb;">
        <p style="color: #1f2937; margin: 0; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${message}</p>
      </div>
    </div>

    <div class="divider"></div>

    <h2>Recommended Actions</h2>

    <p>✅ <strong>Review the inquiry</strong> and assess the client's needs<br>
    📧 <strong>Draft a personalized response</strong> addressing their specific questions<br>
    📞 <strong>Consider a phone call</strong> for complex inquiries or high-value opportunities<br>
    📅 <strong>Schedule a discovery call</strong> if appropriate<br>
    📊 <strong>Log in CRM</strong> for follow-up tracking</p>

    <div style="text-align: center; margin: 35px 0;">
      <a href="mailto:${email}?subject=Re: ${subject || 'Your Inquiry'}" class="button">
        Reply to ${name}
      </a>
    </div>

    <div class="info-box" style="background-color: #f0fdf4; border-left-color: #10b981;">
      <div class="info-box-title">💡 Pro Tip</div>
      <p style="margin: 10px 0 0; color: #4b5563; font-size: 14px;">
        Include a clear call-to-action in your response, such as booking a discovery call or exploring specific services. Personalized responses convert 3x better than generic replies.
      </p>
    </div>

    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;">
      <strong>Submission Timestamp:</strong> ${fullTimestamp}<br>
      <strong>Source:</strong> Website Contact Form
    </p>
  `;

  return generateBaseEmailTemplate({
    title: "New Contact Form Submission",
    preheader: `New inquiry from ${name} - ${subject || 'General Inquiry'}`,
    content,
  });
}

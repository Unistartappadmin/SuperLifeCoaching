import { generateBaseEmailTemplate } from "./base-template";
import { format } from "date-fns";

interface BookingConfirmationData {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  sessionDate: string;
  sessionTime?: string;
  sessionDuration: string;
  packageSessions?: number;
  price: number;
  bookingReference?: string;
  notes?: string;
}

export function generateBookingConfirmationEmail(data: BookingConfirmationData): string {
  const {
    clientName,
    serviceName,
    sessionDate,
    sessionTime,
    sessionDuration,
    packageSessions,
    price,
    bookingReference,
    notes,
  } = data;

  const formattedDate = format(new Date(sessionDate), "EEEE, MMMM d, yyyy");
  const isPackage = packageSessions && packageSessions > 1;

  const content = `
    <h1>Booking Confirmed! 🎉</h1>

    <p>Dear ${clientName},</p>

    <p>Thank you for choosing SuperLife Coaching. We're excited to begin this transformative journey with you!</p>

    <p>Your ${isPackage ? 'package' : 'session'} booking has been successfully confirmed. Here are your booking details:</p>

    <div class="info-box">
      <div class="info-box-title">📋 Booking Details</div>
      ${bookingReference ? `
      <div class="info-row">
        <span class="info-label">Reference Number</span>
        <span class="info-value">${bookingReference}</span>
      </div>
      ` : ''}
      <div class="info-row">
        <span class="info-label">Service</span>
        <span class="info-value">${serviceName}</span>
      </div>
      ${isPackage ? `
      <div class="info-row">
        <span class="info-label">Package</span>
        <span class="info-value">${packageSessions} Sessions</span>
      </div>
      ` : ''}
      <div class="info-row">
        <span class="info-label">First Session Date</span>
        <span class="info-value">${formattedDate}</span>
      </div>
      ${sessionTime ? `
      <div class="info-row">
        <span class="info-label">Time</span>
        <span class="info-value">${sessionTime}</span>
      </div>
      ` : ''}
      <div class="info-row">
        <span class="info-label">Duration</span>
        <span class="info-value">${sessionDuration}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Investment</span>
        <span class="info-value">£${price.toLocaleString()}</span>
      </div>
    </div>

    ${notes ? `
    <div class="info-box">
      <div class="info-box-title">📝 Special Notes</div>
      <p style="margin: 10px 0 0; color: #4b5563; font-size: 14px;">${notes}</p>
    </div>
    ` : ''}

    <div class="divider"></div>

    <h2>What Happens Next?</h2>

    <p><strong>1. Prepare for Your Session</strong><br>
    Take some time to reflect on your goals and what you'd like to achieve through coaching. Consider any specific challenges or areas you'd like to focus on.</p>

    <p><strong>2. Session Details</strong><br>
    ${isPackage
      ? 'We will reach out shortly to schedule your remaining sessions and provide you with the session link or location details.'
      : 'You will receive session access details 24 hours before your scheduled appointment.'
    }</p>

    <p><strong>3. Questions or Changes?</strong><br>
    If you need to reschedule or have any questions, please don't hesitate to contact us. We recommend providing at least 24 hours notice for any changes.</p>

    <div class="divider"></div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://superlifecoaching.uk/dashboard" class="button">
        View My Bookings
      </a>
    </div>

    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
      <strong>Need to make changes?</strong><br>
      Contact us at <a href="mailto:hello@superlifecoaching.uk" style="color: #D4AF37; text-decoration: none;">hello@superlifecoaching.uk</a> or call us at your convenience.
    </p>

    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
      We look forward to supporting you on your journey to personal excellence.
    </p>

    <p style="color: #1f2937; font-weight: 600; margin-top: 25px;">
      Warm regards,<br>
      <span style="color: #D4AF37;">The SuperLife Coaching Team</span>
    </p>
  `;

  return generateBaseEmailTemplate({
    title: "Booking Confirmed - SuperLife Coaching",
    preheader: `Your ${serviceName} session is confirmed for ${formattedDate}`,
    content,
  });
}

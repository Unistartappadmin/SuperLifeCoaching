import { generateBaseEmailTemplate } from "./base-template";
import { format } from "date-fns";

interface AdminBookingNotificationData {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  serviceName: string;
  sessionDate: string;
  sessionTime?: string;
  sessionDuration: string;
  packageSessions?: number;
  price: number;
  paymentStatus: string;
  bookingReference?: string;
  notes?: string;
  bookingId: string;
}

export function generateAdminBookingNotification(data: AdminBookingNotificationData): string {
  const {
    clientName,
    clientEmail,
    clientPhone,
    serviceName,
    sessionDate,
    sessionTime,
    sessionDuration,
    packageSessions,
    price,
    paymentStatus,
    bookingReference,
    notes,
    bookingId,
  } = data;

  const formattedDate = format(new Date(sessionDate), "EEEE, MMMM d, yyyy");
  const isPackage = packageSessions && packageSessions > 1;
  const timestamp = format(new Date(), "HH:mm:ss");

  const content = `
    <h1>🔔 New Booking Received</h1>

    <p>A new ${isPackage ? 'package' : 'session'} booking has been made on your SuperLife Coaching platform.</p>

    <div class="info-box" style="background-color: #fef3c7; border-left-color: #D4AF37;">
      <div class="info-box-title">⏰ Received at ${timestamp}</div>
    </div>

    <div class="info-box">
      <div class="info-box-title">👤 Client Information</div>
      <div class="info-row">
        <span class="info-label">Name</span>
        <span class="info-value">${clientName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email</span>
        <span class="info-value"><a href="mailto:${clientEmail}" style="color: #D4AF37; text-decoration: none;">${clientEmail}</a></span>
      </div>
      ${clientPhone ? `
      <div class="info-row">
        <span class="info-label">Phone</span>
        <span class="info-value"><a href="tel:${clientPhone}" style="color: #D4AF37; text-decoration: none;">${clientPhone}</a></span>
      </div>
      ` : ''}
    </div>

    <div class="info-box">
      <div class="info-box-title">📋 Booking Details</div>
      ${bookingReference ? `
      <div class="info-row">
        <span class="info-label">Reference</span>
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
        <span class="info-label">Date</span>
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
    </div>

    <div class="info-box">
      <div class="info-box-title">💰 Payment Information</div>
      <div class="info-row">
        <span class="info-label">Amount</span>
        <span class="info-value">£${price.toLocaleString()}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status</span>
        <span class="info-value" style="color: ${paymentStatus === 'paid' ? '#10b981' : '#f59e0b'}; font-weight: 700;">
          ${paymentStatus.toUpperCase()}
        </span>
      </div>
    </div>

    ${notes ? `
    <div class="info-box" style="background-color: #fef3c7; border-left-color: #D4AF37;">
      <div class="info-box-title">📝 Client Notes</div>
      <p style="margin: 10px 0 0; color: #4b5563; font-size: 14px; white-space: pre-wrap;">${notes}</p>
    </div>
    ` : ''}

    <div class="divider"></div>

    <h2>Action Required</h2>

    <p>✅ <strong>Confirm the booking</strong> in your admin dashboard<br>
    📅 <strong>Schedule the session</strong> ${isPackage ? 'and subsequent sessions' : ''}<br>
    📧 <strong>Send session details</strong> to the client 24 hours before the appointment<br>
    ${paymentStatus !== 'paid' ? '💳 <strong>Follow up on payment</strong> if required<br>' : ''}</p>

    <div style="text-align: center; margin: 35px 0;">
      <a href="https://superlifecoaching.uk/admin/bookings" class="button">
        View in Admin Dashboard
      </a>
    </div>

    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;">
      <strong>Booking ID:</strong> ${bookingId}<br>
      <strong>Timestamp:</strong> ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}
    </p>
  `;

  return generateBaseEmailTemplate({
    title: "New Booking - Admin Notification",
    preheader: `New ${serviceName} booking from ${clientName}`,
    content,
  });
}

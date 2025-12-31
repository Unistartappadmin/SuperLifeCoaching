import { Resend } from "resend";
import {
  generateBookingConfirmationEmail,
  generateAdminBookingNotification,
  generateContactAutoReply,
  generateContactAdminNotification,
} from "./email-templates";

const resendApiKey = process.env.RESEND_API_KEY;
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

const defaultFrom =
  process.env.RESEND_FROM_EMAIL ||
  "SuperLife Coaching <noreply@superlifecoaching.uk>";

const adminEmail = process.env.BOOKING_ADMIN_EMAIL || "hello@superlifecoaching.uk";

type EmailContext = {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  slotLabel: string;
  timezone: string;
  totalSessions?: number;
};

type PaymentReceiptContext = {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  amount: number;
  currency: string;
  paymentIntentId: string;
  receiptUrl?: string;
  slotLabel: string;
  timezone: string;
  totalSessions?: number;
};

function ensureClient() {
  if (!resendClient) {
    throw new Error("RESEND_API_KEY missing. Email client unavailable.");
  }
  return resendClient;
}

/**
 * Resend SDK returns { data, error }.
 * This helper ensures we NEVER silently “succeed” when Resend actually failed.
 * It returns the message id so callers (like tests) can log it.
 */
type ResendSendParams = Parameters<Resend["emails"]["send"]>[0];

async function sendEmailOrThrow(client: Resend, params: ResendSendParams) {
  const { data, error } = await client.emails.send(params);

  if (error) {
    const msg =
      typeof error === "string" ? error : JSON.stringify(error, null, 2);
    throw new Error(`Resend error: ${msg}`);
  }

  const id = (data as any)?.id;
  if (!id) {
    throw new Error("Resend error: Missing message id (data.id)");
  }

  return id as string;
}

export async function sendClientConfirmationEmail(
  context: EmailContext & { isPaid?: boolean; amount?: number }
): Promise<string> {
  const client = ensureClient();

  const html = generateBookingConfirmationEmail({
    clientName: context.clientName,
    clientEmail: context.clientEmail,
    serviceName: context.serviceName,
    sessionDate: context.slotLabel,
    sessionDuration: "60 minutes", // Can be made dynamic if needed
    packageSessions: context.totalSessions,
    price: context.amount || 0,
    notes: context.isPaid ? "Payment confirmed - your booking is fully secured." : undefined,
  });

  return sendEmailOrThrow(client, {
    from: defaultFrom,
    to: context.clientEmail,
    subject: `Booking Confirmed - ${context.serviceName}`,
    html,
  });
}

export async function sendPaymentReceiptEmail(
  context: PaymentReceiptContext
): Promise<string> {
  const client = ensureClient();

  const subject = `Payment Receipt - ${context.serviceName}`;
  const currencySymbol =
    context.currency.toUpperCase() === "USD" ? "$" : context.currency;

  const remainingSessions =
    context.totalSessions && context.totalSessions > 1
      ? `<p>Your package includes <strong>${context.totalSessions} sessions</strong>. The remaining ${
          context.totalSessions - 1
        } sessions will be scheduled after your first meeting.</p>`
      : "";

  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">Payment Receipt</h2>
      <p>Hi ${context.clientName},</p>
      <p>Thank you for your payment! Your booking for <strong>${context.serviceName}</strong> is now confirmed.</p>

      <div style="background-color: #f0fdf4; border: 1px solid #86efac; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <h3 style="color: #16a34a; margin-top: 0;">Payment Successful</h3>
        <p style="font-size: 32px; font-weight: bold; color: #15803d; margin: 16px 0;">
          ${currencySymbol}${context.amount.toFixed(2)}
        </p>
        <p style="color: #166534; margin: 4px 0;">Payment ID: ${context.paymentIntentId}</p>
        ${
          context.receiptUrl
            ? `<p style="margin-top: 12px;"><a href="${context.receiptUrl}" style="color: #2563eb; text-decoration: none;">View Stripe Receipt →</a></p>`
            : ""
        }
      </div>

      <h3 style="color: #374151;">Session Details</h3>
      <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px;">
        <p style="margin: 8px 0;"><strong>Service:</strong> ${context.serviceName}</p>
        <p style="margin: 8px 0;"><strong>First Session:</strong> ${context.slotLabel}</p>
        <p style="margin: 8px 0;"><strong>Timezone:</strong> ${context.timezone}</p>
      </div>

      ${remainingSessions}

      <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
        This is your official payment receipt. Please keep it for your records.
      </p>
      <p style="margin-top: 32px; color: #6b7280;">— SuperLife Coaching</p>
    </div>
  `;

  return sendEmailOrThrow(client, {
    from: defaultFrom,
    to: context.clientEmail,
    subject,
    html,
  });
}

export async function sendAdminNotificationEmail(
  context: EmailContext & { isPaid?: boolean; amount?: number; bookingId?: string }
): Promise<string> {
  const client = ensureClient();

  const html = generateAdminBookingNotification({
    clientName: context.clientName,
    clientEmail: context.clientEmail,
    serviceName: context.serviceName,
    sessionDate: context.slotLabel,
    sessionDuration: "60 minutes",
    packageSessions: context.totalSessions,
    price: context.amount || 0,
    paymentStatus: context.isPaid ? "paid" : "pending",
    bookingId: context.bookingId || `BK-${Date.now()}`,
  });

  return sendEmailOrThrow(client, {
    from: defaultFrom,
    to: adminEmail,
    subject: `New Booking - ${context.serviceName} from ${context.clientName}`,
    html,
  });
}

// Contact form email types
type ContactFormData = {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
};

/**
 * Send auto-reply to contact form submission
 */
export async function sendContactAutoReply(
  data: ContactFormData
): Promise<string> {
  const client = ensureClient();

  const html = generateContactAutoReply({
    name: data.name,
    email: data.email,
    subject: data.subject,
    message: data.message,
  });

  return sendEmailOrThrow(client, {
    from: defaultFrom,
    to: data.email,
    subject: "Thank You for Contacting SuperLife Coaching",
    html,
  });
}

/**
 * Send contact form notification to admin
 */
export async function sendContactAdminNotification(
  data: ContactFormData
): Promise<string> {
  const client = ensureClient();

  const html = generateContactAdminNotification({
    name: data.name,
    email: data.email,
    phone: data.phone,
    subject: data.subject,
    message: data.message,
    submittedAt: new Date(),
  });

  return sendEmailOrThrow(client, {
    from: defaultFrom,
    to: adminEmail,
    subject: `New Contact Form: ${data.subject || "General Inquiry"} - ${data.name}`,
    html,
  });
}
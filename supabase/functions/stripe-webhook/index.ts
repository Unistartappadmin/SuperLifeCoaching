// @ts-nocheck
/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "npm:stripe@20.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.2";
import { Resend } from "npm:resend@6.5.2";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("PUBLIC_SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is required for the stripe-webhook function.");
}

if (!STRIPE_WEBHOOK_SECRET) {
  throw new Error("STRIPE_WEBHOOK_SECRET is required for the stripe-webhook function.");
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "SuperLife Coaching <noreply@superlifecoaching.com>";
const adminEmail = Deno.env.get("BOOKING_ADMIN_EMAIL") ?? "hello@superlifecoaching.com";
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

type ServiceSlug = "free-call" | "clarifying-session" | "breakthrough-package" | "transformational-package";

type BookingService = {
  name: string;
  sessions?: number;
};

const SERVICES: Record<ServiceSlug, BookingService> = {
  "free-call": {
    name: "Free Initial Call",
  },
  "clarifying-session": {
    name: "1:1 Coaching Session – Clarifying",
  },
  "breakthrough-package": {
    name: "Breakthrough Coaching Package – 4 Sessions",
    sessions: 4,
  },
  "transformational-package": {
    name: "Transformational Coaching Package – 12 Sessions",
    sessions: 12,
  },
};

serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing signature header", { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      STRIPE_WEBHOOK_SECRET,
      undefined,
      cryptoProvider,
    );
  } catch (err) {
    console.error("Failed to verify Stripe webhook:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.canceled":
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return new Response("Webhook handler failed", { status: 500 });
  }
});

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const { data: booking, error } = await supabase
    .from("bookings")
    .select(
      `
      id,
      status,
      payment_status,
      service_type,
      session_date,
      session_time,
      users (
        name,
        email
      )
    `,
    )
    .eq("stripe_payment_intent_id", paymentIntent.id)
    .maybeSingle();

  if (error || !booking) {
    console.error("Booking not found for payment intent:", paymentIntent.id, error);
    return;
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "confirmed",
      payment_status: "paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", booking.id);

  if (updateError) {
    console.error("Failed to update booking:", updateError);
    return;
  }

  // Send all emails
  await Promise.allSettled([
    sendReceiptEmail(booking, paymentIntent),
    sendConfirmationEmail(booking, paymentIntent),
    sendAdminNotification(booking),
  ]);
}

async function sendReceiptEmail(
  booking: {
    service_type: ServiceSlug;
    session_date: string;
    session_time: string;
    users: { name: string; email: string } | { name: string; email: string }[] | null;
  },
  paymentIntent: Stripe.PaymentIntent,
) {
  if (!resendClient) {
    console.warn("RESEND_API_KEY not set. Skipping receipt email.");
    return;
  }

  const service = SERVICES[booking.service_type];
  const userRecord = Array.isArray(booking.users) ? booking.users[0] : booking.users;

  if (!service || !userRecord?.email || !userRecord?.name) {
    console.warn("Missing user or service info for receipt email.");
    return;
  }

  let receiptUrl: string | undefined;
  if (paymentIntent.latest_charge) {
    const chargeId = typeof paymentIntent.latest_charge === "string"
      ? paymentIntent.latest_charge
      : paymentIntent.latest_charge.id;
    const charge = await stripe.charges.retrieve(chargeId);
    receiptUrl = charge.receipt_url ?? undefined;
  }

  const slotDate = new Date(`${booking.session_date}T${booking.session_time}`);
  const slotLabel = slotDate.toLocaleString("en-GB", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const currencySymbol = paymentIntent.currency?.toUpperCase() === "GBP" ? "£" : "$";
  const amount = (paymentIntent.amount_received ?? paymentIntent.amount ?? 0) / 100;
  const totalSessions = service.sessions;

  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">Payment Receipt</h2>
      <p>Hi ${userRecord.name},</p>
      <p>Thank you for your payment! Your booking for <strong>${service.name}</strong> is now confirmed.</p>

      <div style="background-color: #f0fdf4; border: 1px solid #86efac; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <h3 style="color: #16a34a; margin-top: 0;">Payment Successful</h3>
        <p style="font-size: 32px; font-weight: bold; color: #15803d; margin: 16px 0;">
          ${currencySymbol}${amount.toFixed(2)}
        </p>
        <p style="color: #166534; margin: 4px 0;">Payment ID: ${paymentIntent.id}</p>
        ${receiptUrl ? `<p style="margin-top: 12px;"><a href="${receiptUrl}" style="color: #2563eb; text-decoration: none;">View Stripe Receipt →</a></p>` : ""}
      </div>

      <h3 style="color: #374151;">Session Details</h3>
      <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px;">
        <p style="margin: 8px 0;"><strong>Service:</strong> ${service.name}</p>
        <p style="margin: 8px 0;"><strong>First Session:</strong> ${slotLabel}</p>
        <p style="margin: 8px 0;"><strong>Timezone:</strong> GMT</p>
      </div>

      ${totalSessions && totalSessions > 1
        ? `<p>Your package includes <strong>${totalSessions} sessions</strong>. The remaining ${totalSessions - 1} sessions will be scheduled after your first meeting.</p>`
        : ""}

      <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
        This is your official payment receipt. Please keep it for your records.
      </p>
      <p style="margin-top: 32px; color: #6b7280;">— SuperLife Coaching</p>
    </div>
  `;

  await resendClient.emails.send({
    from: resendFromEmail,
    to: userRecord.email,
    subject: `Payment Receipt - ${service.name}`,
    html,
  });
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, status, payment_status")
    .eq("stripe_payment_intent_id", paymentIntent.id)
    .maybeSingle();

  if (error || !booking) {
    console.error("Booking not found for failed payment intent:", paymentIntent.id, error);
    return;
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "failed",
      payment_status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", booking.id);

  if (updateError) {
    console.error("Failed to update booking status to failed:", updateError);
    return;
  }

  console.log(`Booking ${booking.id} marked as failed due to payment failure`);
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, status, payment_status")
    .eq("stripe_payment_intent_id", paymentIntent.id)
    .maybeSingle();

  if (error || !booking) {
    console.error("Booking not found for canceled payment intent:", paymentIntent.id, error);
    return;
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "canceled",
      payment_status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", booking.id);

  if (updateError) {
    console.error("Failed to update booking status to canceled:", updateError);
    return;
  }

  console.log(`Booking ${booking.id} marked as canceled due to payment cancellation`);
}

async function sendConfirmationEmail(
  booking: {
    service_type: ServiceSlug;
    session_date: string;
    session_time: string;
    users: { name: string; email: string } | { name: string; email: string }[] | null;
  },
  paymentIntent: Stripe.PaymentIntent,
) {
  if (!resendClient) {
    console.warn("RESEND_API_KEY not set. Skipping confirmation email.");
    return;
  }

  const service = SERVICES[booking.service_type];
  const userRecord = Array.isArray(booking.users) ? booking.users[0] : booking.users;

  if (!service || !userRecord?.email || !userRecord?.name) {
    console.warn("Missing user or service info for confirmation email.");
    return;
  }

  const slotDate = new Date(`${booking.session_date}T${booking.session_time}`);
  const slotLabel = slotDate.toLocaleString("en-GB", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const currencySymbol = paymentIntent.currency?.toUpperCase() === "GBP" ? "£" : "$";
  const amount = (paymentIntent.amount_received ?? paymentIntent.amount ?? 0) / 100;
  const totalSessions = service.sessions;
  const remainingSessions =
    totalSessions && totalSessions > 1
      ? `<p>Your package includes <strong>${totalSessions} sessions</strong>. The remaining ${totalSessions - 1} sessions will be scheduled after we meet.</p>`
      : "";

  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">Hi ${userRecord.name},</h2>
      <p>Thank you for booking <strong>${service.name}</strong>!</p>

      <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px; margin: 16px 0;">
        <strong>Payment Confirmed</strong><br/>
        Amount paid: ${currencySymbol}${amount.toFixed(2)}<br/>
        <span style="color: #16a34a;">✓ Your booking is fully confirmed</span>
      </div>

      <h3 style="color: #374151; margin-top: 24px;">Session Details</h3>
      <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px;">
        <p style="margin: 8px 0;"><strong>Service:</strong> ${service.name}</p>
        <p style="margin: 8px 0;"><strong>First Session:</strong> ${slotLabel}</p>
        <p style="margin: 8px 0;"><strong>Timezone:</strong> GMT</p>
      </div>

      ${remainingSessions}

      <p style="margin-top: 24px;">You'll receive a Google Calendar invite shortly. Please add it to your calendar!</p>
      <p>Looking forward to our conversation!</p>
      <p style="margin-top: 32px; color: #6b7280;">— SuperLife Coaching</p>
    </div>
  `;

  await resendClient.emails.send({
    from: resendFromEmail,
    to: userRecord.email,
    subject: `Your ${service.name} booking is confirmed`,
    html,
  });
}

async function sendAdminNotification(booking: {
  service_type: ServiceSlug;
  session_date: string;
  session_time: string;
  users: { name: string; email: string } | { name: string; email: string }[] | null;
}) {
  if (!resendClient) {
    console.warn("RESEND_API_KEY not set. Skipping admin notification.");
    return;
  }

  const service = SERVICES[booking.service_type];
  const userRecord = Array.isArray(booking.users) ? booking.users[0] : booking.users;

  if (!service || !userRecord?.email || !userRecord?.name) {
    console.warn("Missing user or service info for admin notification.");
    return;
  }

  const slotDate = new Date(`${booking.session_date}T${booking.session_time}`);
  const slotLabel = slotDate.toLocaleString("en-GB", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const totalSessions = service.sessions;

  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif;">
      <h3>New booking received:</h3>
      <ul>
        <li><strong>Client:</strong> ${userRecord.name} (${userRecord.email})</li>
        <li><strong>Service:</strong> ${service.name}</li>
        <li><strong>First Session:</strong> ${slotLabel} (GMT)</li>
        ${totalSessions && totalSessions > 1 ? `<li><strong>Total Sessions:</strong> ${totalSessions}</li>` : ""}
      </ul>
    </div>
  `;

  await resendClient.emails.send({
    from: resendFromEmail,
    to: adminEmail,
    subject: `New booking: ${service.name}`,
    html,
  });
}

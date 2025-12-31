// @ts-nocheck
/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "npm:stripe@20.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.2";
import { Resend } from "npm:resend@6.5.2";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("PUBLIC_SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is required for the create-payment-intent function.");
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "SuperLife Coaching <noreply@superlifecoaching.com>";
const adminEmail = Deno.env.get("BOOKING_ADMIN_EMAIL") ?? "hello@superlifecoaching.com";
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

type ServiceSlug = "free-call" | "clarifying-session" | "breakthrough-package" | "transformational-package";

type BookingService = {
  slug: ServiceSlug;
  name: string;
  price: number;
  duration: number;
  sessions?: number;
};

const SERVICES: Record<ServiceSlug, BookingService> = {
  "free-call": {
    slug: "free-call",
    name: "Free Initial Call",
    price: 0,
    duration: 30,
  },
  "clarifying-session": {
    slug: "clarifying-session",
    name: "1:1 Coaching Session – Clarifying",
    price: 69,
    duration: 45,
  },
  "breakthrough-package": {
    slug: "breakthrough-package",
    name: "Breakthrough Coaching Package – 4 Sessions",
    price: 290,
    duration: 60,
    sessions: 4,
  },
  "transformational-package": {
    slug: "transformational-package",
    name: "Transformational Coaching Package – 12 Sessions",
    price: 790,
    duration: 60,
    sessions: 12,
  },
};

const corsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization,content-type,apikey",
  "Vary": "Origin",
});

const jsonHeaders = (origin: string) => ({
  ...corsHeaders(origin),
  "Content-Type": "application/json",
});

type SlotPayload = {
  start: string;
  end: string;
  label: string;
  timezone: string;
};

type PaymentIntentPayload = {
  serviceSlug?: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  slot?: SlotPayload;
};

const currency = "gbp";

serve(async (request) => {
  const origin = request.headers.get("origin") ?? "*";

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: jsonHeaders(origin),
    });
  }

  let payload: PaymentIntentPayload;

  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: jsonHeaders(origin),
    });
  }

  const { serviceSlug, customerEmail, customerName, customerPhone, notes, slot } = payload;

  if (!serviceSlug || !(serviceSlug in SERVICES)) {
    return new Response(JSON.stringify({ error: "Invalid service" }), {
      status: 400,
      headers: jsonHeaders(origin),
    });
  }

  if (!customerName || !customerEmail) {
    return new Response(JSON.stringify({ error: "Customer name and email are required" }), {
      status: 400,
      headers: jsonHeaders(origin),
    });
  }

  if (!slot?.start) {
    return new Response(JSON.stringify({ error: "Booking slot is required" }), {
      status: 400,
      headers: jsonHeaders(origin),
    });
  }

  const service = SERVICES[serviceSlug as ServiceSlug];

  // Handle free services
  if (service.price === 0) {
    try {
      const userId = await getOrCreateUser({
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
      });

      if (!userId) {
        return new Response(
          JSON.stringify({ error: "Failed to create user" }),
          { status: 500, headers: jsonHeaders(origin) },
        );
      }

      const slotDate = new Date(slot.start);
      if (Number.isNaN(slotDate.getTime())) {
        return new Response(
          JSON.stringify({ error: "Invalid slot start time" }),
          { status: 400, headers: jsonHeaders(origin) },
        );
      }

      const sessionDate = slotDate.toISOString().split("T")[0] ?? "";
      const sessionTime = slotDate.toISOString().split("T")[1]?.split(".")[0] ?? "00:00:00";

      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          user_id: userId,
          service_type: serviceSlug,
          session_date: sessionDate,
          session_time: sessionTime,
          duration: service.duration,
          status: "confirmed",
          payment_status: "free",
          notes: notes ?? null,
        })
        .select("id")
        .single();

      if (bookingError || !booking) {
        console.error("Failed to create booking:", bookingError);
        return new Response(
          JSON.stringify({ error: "Failed to create booking" }),
          { status: 500, headers: jsonHeaders(origin) },
        );
      }

      if (service.sessions && service.sessions > 1) {
        await createPackageSessions(booking.id, {
          sessionDate,
          sessionTime,
          totalSessions: service.sessions,
        });
      }

      // Send confirmation emails for free booking
      const slotDate = new Date(slot.start);
      const slotLabel = slotDate.toLocaleString("en-GB", {
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

      await Promise.allSettled([
        sendFreeBookingConfirmation({
          customerName,
          customerEmail,
          serviceName: service.name,
          slotLabel,
          totalSessions: service.sessions,
        }),
        sendFreeBookingAdminNotification({
          customerName,
          customerEmail,
          serviceName: service.name,
          slotLabel,
          totalSessions: service.sessions,
        }),
      ]);

      return new Response(
        JSON.stringify({
          requiresPayment: false,
          service: service.name,
          bookingId: booking.id,
        }),
        { status: 200, headers: jsonHeaders(origin) },
      );
    } catch (error) {
      console.error("Error creating free booking:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      return new Response(
        JSON.stringify({
          error: "Failed to create booking",
          details: message,
        }),
        { status: 500, headers: jsonHeaders(origin) },
      );
    }
  }

  try {
    // Create or get user
    const userId = await getOrCreateUser({
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
    });

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Failed to create user" }),
        { status: 500, headers: jsonHeaders(origin) },
      );
    }

    // Parse slot date/time
    const slotDate = new Date(slot.start);
    if (Number.isNaN(slotDate.getTime())) {
      return new Response(
        JSON.stringify({ error: "Invalid slot start time" }),
        { status: 400, headers: jsonHeaders(origin) },
      );
    }

    const sessionDate = slotDate.toISOString().split("T")[0] ?? "";
    const sessionTime = slotDate.toISOString().split("T")[1]?.split(".")[0] ?? "00:00:00";

    // Create payment intent first to get the ID
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(service.price * 100),
      currency,
      payment_method_types: ["card"],
      metadata: {
        serviceSlug,
        serviceName: service.name,
        customerEmail,
        customerName,
        duration: service.duration.toString(),
        sessions: service.sessions?.toString() ?? "1",
      },
      receipt_email: customerEmail,
    });

    // Create booking with pending status
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        user_id: userId,
        service_type: serviceSlug,
        session_date: sessionDate,
        session_time: sessionTime,
        duration: service.duration,
        status: "pending",
        payment_status: "pending",
        stripe_payment_intent_id: paymentIntent.id,
        notes: notes ?? null,
      })
      .select("id")
      .single();

    if (bookingError || !booking) {
      console.error("Failed to create booking:", bookingError);
      // Cancel the payment intent since booking creation failed
      await stripe.paymentIntents.cancel(paymentIntent.id);
      return new Response(
        JSON.stringify({ error: "Failed to create booking" }),
        { status: 500, headers: jsonHeaders(origin) },
      );
    }

    // Create package sessions if this is a multi-session package
    if (service.sessions && service.sessions > 1) {
      await createPackageSessions(booking.id, {
        sessionDate,
        sessionTime,
        totalSessions: service.sessions,
      });
    }

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        requiresPayment: true,
        amount: service.price,
        currency,
        bookingId: booking.id,
      }),
      { status: 200, headers: jsonHeaders(origin) },
    );
  } catch (error) {
    console.error("Error creating payment intent:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        error: "Failed to create payment intent",
        details: message,
      }),
      { status: 500, headers: jsonHeaders(origin) },
    );
  }
});

async function getOrCreateUser(payload: {
  name: string;
  email: string;
  phone?: string;
}): Promise<string | null> {
  const { data: existingUser, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("email", payload.email)
    .maybeSingle();

  if (userError) {
    console.error("User lookup failed", userError);
    return null;
  }

  if (existingUser?.id) {
    return existingUser.id;
  }

  const { data: newUser, error: insertUserError } = await supabase
    .from("users")
    .insert({
      email: payload.email,
      name: payload.name,
      phone: payload.phone,
    })
    .select("id")
    .single();

  if (insertUserError || !newUser) {
    console.error("User creation failed", insertUserError);
    return null;
  }

  return newUser.id;
}

async function createPackageSessions(
  bookingId: string,
  options: { sessionDate: string; sessionTime: string; totalSessions: number },
) {
  const payload = Array.from({ length: options.totalSessions }, (_, index) => {
    const sessionNumber = index + 1;
    if (sessionNumber === 1) {
      return {
        booking_id: bookingId,
        session_number: sessionNumber,
        session_date: options.sessionDate,
        session_time: options.sessionTime,
        status: "scheduled",
      };
    }
    return {
      booking_id: bookingId,
      session_number: sessionNumber,
      status: "pending",
    };
  });

  const { error } = await supabase.from("package_sessions").insert(payload);
  if (error) {
    console.error("Failed to create package sessions", error);
  }
}

async function sendFreeBookingConfirmation(context: {
  customerName: string;
  customerEmail: string;
  serviceName: string;
  slotLabel: string;
  totalSessions?: number;
}) {
  if (!resendClient) {
    console.warn("RESEND_API_KEY not set. Skipping confirmation email.");
    return;
  }

  const remainingSessions =
    context.totalSessions && context.totalSessions > 1
      ? `<p>Your package includes <strong>${context.totalSessions} sessions</strong>. The remaining ${context.totalSessions - 1} sessions will be scheduled after we meet.</p>`
      : "";

  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937;">Hi ${context.customerName},</h2>
      <p>Thank you for booking <strong>${context.serviceName}</strong>!</p>

      <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px; margin: 16px 0;">
        <strong>Booking Confirmed</strong><br/>
        <span style="color: #16a34a;">✓ Your booking is confirmed</span>
      </div>

      <h3 style="color: #374151; margin-top: 24px;">Session Details</h3>
      <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px;">
        <p style="margin: 8px 0;"><strong>Service:</strong> ${context.serviceName}</p>
        <p style="margin: 8px 0;"><strong>Session:</strong> ${context.slotLabel}</p>
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
    to: context.customerEmail,
    subject: `Your ${context.serviceName} booking is confirmed`,
    html,
  });
}

async function sendFreeBookingAdminNotification(context: {
  customerName: string;
  customerEmail: string;
  serviceName: string;
  slotLabel: string;
  totalSessions?: number;
}) {
  if (!resendClient) {
    console.warn("RESEND_API_KEY not set. Skipping admin notification.");
    return;
  }

  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif;">
      <h3>New booking received:</h3>
      <ul>
        <li><strong>Client:</strong> ${context.customerName} (${context.customerEmail})</li>
        <li><strong>Service:</strong> ${context.serviceName}</li>
        <li><strong>Session:</strong> ${context.slotLabel} (GMT)</li>
        ${context.totalSessions && context.totalSessions > 1 ? `<li><strong>Total Sessions:</strong> ${context.totalSessions}</li>` : ""}
      </ul>
    </div>
  `;

  await resendClient.emails.send({
    from: resendFromEmail,
    to: adminEmail,
    subject: `New booking: ${context.serviceName}`,
    html,
  });
}

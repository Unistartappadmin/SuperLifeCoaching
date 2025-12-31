import type { APIRoute } from "astro";
import Stripe from "stripe";
import { createSupabaseServiceRoleClient } from "../../../lib/supabase";
import { SERVICES, type ServiceSlug } from "../../../components/booking/service-data";
import { createCalendarEvent } from "../../../lib/google-calendar";
import { sendAdminNotificationEmail, sendClientConfirmationEmail, sendPaymentReceiptEmail } from "../../../lib/email";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe =
  stripeSecret && stripeSecret.startsWith("sk_")
    ? new Stripe(stripeSecret, { apiVersion: "2025-11-17.clover" })
    : null;

type SlotPayload = {
  start: string;
  end: string;
  label: string;
  timezone: string;
};

type BookingRequest = {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  serviceSlug: ServiceSlug;
  slot: SlotPayload;
  paymentIntentId?: string;
};

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as BookingRequest;
    const validationError = validateRequest(body);
    if (validationError) {
      return jsonResponse({ error: validationError }, 400);
    }

    const service = SERVICES[body.serviceSlug];
    const slotDate = new Date(body.slot.start);
    if (Number.isNaN(slotDate.getTime())) {
      return jsonResponse({ error: "Invalid slot start time." }, 400);
    }

    // For paid services, verify payment was completed
    if (service.price > 0 && body.paymentIntentId && body.paymentIntentId !== 'free') {
      if (!stripe) {
        return jsonResponse({ error: "Payment verification unavailable." }, 500);
      }

      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(body.paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
          return jsonResponse({ error: "Payment not completed." }, 400);
        }

        // Verify amount matches service price
        const expectedAmount = Math.round(service.price * 100);
        if (paymentIntent.amount !== expectedAmount) {
          return jsonResponse({ error: "Payment amount mismatch." }, 400);
        }
      } catch (error) {
        console.error('Payment verification failed:', error);
        return jsonResponse({ error: "Invalid payment." }, 400);
      }
    }

    const sessionDate = slotDate.toISOString().split("T")[0] ?? "";
    const sessionTime = slotDate.toISOString().split("T")[1]?.split(".")[0] ?? "00:00:00";

    const supabase = createSupabaseServiceRoleClient();
    const userId = await getOrCreateUser(supabase, {
      name: body.name,
      email: body.email,
      phone: body.phone,
    });

    if (!userId) {
      return jsonResponse({ error: "Unable to create user." }, 500);
    }

    // Determine booking status based on payment
    const isPaid = service.price === 0 || (body.paymentIntentId && body.paymentIntentId !== 'free');

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        user_id: userId,
        service_type: service.slug,
        session_date: sessionDate,
        session_time: sessionTime,
        duration: service.duration,
        status: isPaid ? "confirmed" : "pending",
        payment_status: isPaid ? "paid" : "pending",
        stripe_payment_intent_id: body.paymentIntentId && body.paymentIntentId !== 'free' ? body.paymentIntentId : null,
        notes: body.notes ?? null,
      })
      .select("id")
      .single();

    if (bookingError || !booking) {
      console.error(bookingError);
      return jsonResponse({ error: "Unable to create booking." }, 500);
    }

    if (service.sessions && service.sessions > 1) {
      await upsertPackageSessions(supabase, booking.id, {
        sessionDate,
        sessionTime,
        totalSessions: service.sessions,
      });
    }

    let calendarEventId: string | null = null;
    try {
      const event = await createCalendarEvent({
        summary: `${service.name} - ${body.name}`,
        description: buildEventDescription(body, service),
        start: body.slot.start,
        end: body.slot.end,
        timezone: body.slot.timezone,
        attendees: [{ email: body.email, displayName: body.name }],
        metadata: {
          booking_id: booking.id,
          service_slug: service.slug,
        },
      });
      calendarEventId = event.id ?? null;
    } catch (calendarError) {
      console.error("Failed to create calendar event", calendarError);
    }

    if (calendarEventId) {
      await supabase.from("bookings").update({ google_calendar_event_id: calendarEventId }).eq("id", booking.id);
      if (service.sessions && service.sessions > 1) {
        await supabase
          .from("package_sessions")
          .update({ google_calendar_event_id: calendarEventId, status: "scheduled" })
          .eq("booking_id", booking.id)
          .eq("session_number", 1);
      }
    }

    try {
      const emailPromises = [
        sendClientConfirmationEmail({
          clientName: body.name,
          clientEmail: body.email,
          serviceName: service.name,
          slotLabel: body.slot.label,
          timezone: body.slot.timezone,
          totalSessions: service.sessions,
          isPaid: isPaid ? true : undefined,
          amount: isPaid ? service.price : undefined,
        }),
        sendAdminNotificationEmail({
          clientName: body.name,
          clientEmail: body.email,
          serviceName: service.name,
          slotLabel: body.slot.label,
          timezone: body.slot.timezone,
          totalSessions: service.sessions,
        }),
      ];

      // Send payment receipt for paid services
      if (isPaid && body.paymentIntentId && body.paymentIntentId !== 'free' && stripe) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(body.paymentIntentId);

          // Get the latest charge for receipt URL
          let receiptUrl: string | undefined;
          if (paymentIntent.latest_charge) {
            const chargeId = typeof paymentIntent.latest_charge === 'string'
              ? paymentIntent.latest_charge
              : paymentIntent.latest_charge.id;
            const charge = await stripe.charges.retrieve(chargeId);
            receiptUrl = charge.receipt_url || undefined;
          }

          emailPromises.push(
            sendPaymentReceiptEmail({
              clientName: body.name,
              clientEmail: body.email,
              serviceName: service.name,
              amount: service.price,
              currency: 'usd',
              paymentIntentId: body.paymentIntentId,
              receiptUrl,
              slotLabel: body.slot.label,
              timezone: body.slot.timezone,
              totalSessions: service.sessions,
            })
          );
        } catch (error) {
          console.error('Failed to retrieve payment intent for receipt:', error);
        }
      }

      await Promise.allSettled(emailPromises);
    } catch (emailError) {
      console.error("Failed to send booking emails", emailError);
    }

    // Payment is handled before booking creation now
    return jsonResponse({
      bookingId: booking.id,
      requiresPayment: false,
    });
  } catch (error) {
    console.error("Booking creation failed", error);
    return jsonResponse({ error: "Unexpected error creating booking." }, 500);
  }
};

function validateRequest(body: Partial<BookingRequest>) {
  if (!body.name || body.name.trim().length < 2) return "Name is required.";
  if (!body.email || !/\S+@\S+\.\S+/.test(body.email)) return "Valid email is required.";
  if (!body.serviceSlug || !SERVICES[body.serviceSlug]) return "Invalid service type.";
  if (!body.slot?.start) return "Time slot is required.";
  return null;
}

async function getOrCreateUser(
  supabase: ReturnType<typeof createSupabaseServiceRoleClient>,
  payload: { name: string; email: string; phone?: string },
) {
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

async function upsertPackageSessions(
  supabase: ReturnType<typeof createSupabaseServiceRoleClient>,
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

function buildEventDescription(body: BookingRequest, service: (typeof SERVICES)[ServiceSlug]) {
  return [
    `Service: ${service.name}`,
    `Client: ${body.name} (${body.email})`,
    body.phone ? `Phone: ${body.phone}` : "",
    body.notes ? `Notes: ${body.notes}` : "",
    service.sessions && service.sessions > 1
      ? `Package includes ${service.sessions} sessions. Remaining sessions will be scheduled after the first meeting.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

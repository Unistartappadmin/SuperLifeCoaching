import type { APIRoute } from "astro";
import { createSupabaseServiceRoleClient } from "../../../lib/supabase";

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const supabase = createSupabaseServiceRoleClient();

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        id,
        session_date,
        session_time,
        duration,
        service_type,
        status,
        payment_status,
        stripe_payment_intent_id,
        notes,
        created_at,
        users (name, email, phone)
      `)
      .order("session_date", { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify(bookings), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch bookings" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

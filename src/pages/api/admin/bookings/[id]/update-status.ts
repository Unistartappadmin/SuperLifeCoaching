import type { APIRoute } from "astro";
import { createSupabaseServiceRoleClient } from "../../../../../lib/supabase";

export const prerender = false;

const VALID_STATUSES = ["pending", "confirmed", "completed", "cancelled"];

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Booking ID is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      return new Response(
        JSON.stringify({
          error: "Invalid status. Must be one of: pending, confirmed, completed, cancelled",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createSupabaseServiceRoleClient();

    const { data, error } = await supabase
      .from("bookings")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update booking" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

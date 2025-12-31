import type { APIRoute } from "astro";
import { getAvailableSlots } from "../../../lib/google-calendar";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const base =
    request.headers.get("origin") ??
    (typeof process !== "undefined" ? process.env.PUBLIC_SITE_URL : undefined) ??
    "http://localhost:4321";
  const url = new URL(request.url, base);
  console.log("[availability] Query params:", Object.fromEntries(url.searchParams));
  const date = url.searchParams.get("date");
  const duration = Number(url.searchParams.get("duration") ?? 60);

  if (!date || Number.isNaN(duration) || duration <= 0) {
    return jsonResponse({ error: "Missing `date` or invalid `duration`." }, 400);
  }

  try {
    const slots = await getAvailableSlots(date, duration);
    return jsonResponse({ slots });
  } catch (error) {
    console.error("Availability calculation failed", error);
    return jsonResponse({ error: "Unable to fetch availability." }, 500);
  }
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

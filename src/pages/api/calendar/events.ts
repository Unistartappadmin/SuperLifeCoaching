import type { APIRoute } from "astro";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
} from "../../../lib/google-calendar";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    if (!body?.summary || !body?.start || !body?.end) {
      return jsonResponse({ error: "Missing summary/start/end." }, 400);
    }

    const event = await createCalendarEvent({
      summary: body.summary,
      description: body.description,
      start: body.start,
      end: body.end,
      timezone: body.timezone,
      attendees: body.attendees,
      metadata: body.metadata,
    });

    return jsonResponse({ event });
  } catch (error) {
    console.error("Failed to create calendar event", error);
    return jsonResponse({ error: "Unable to create event." }, 500);
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const eventId = body?.eventId;
    if (!eventId) {
      return jsonResponse({ error: "eventId is required." }, 400);
    }

    const event = await updateCalendarEvent(eventId, {
      summary: body.summary,
      description: body.description,
      start: body.start,
      end: body.end,
      timezone: body.timezone,
      attendees: body.attendees,
      metadata: body.metadata,
    });

    return jsonResponse({ event });
  } catch (error) {
    console.error("Failed to update calendar event", error);
    return jsonResponse({ error: "Unable to update event." }, 500);
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const eventId = url.searchParams.get("eventId");

  if (!eventId) {
    return jsonResponse({ error: "eventId is required." }, 400);
  }

  try {
    await deleteCalendarEvent(eventId);
    return jsonResponse({ deleted: true });
  } catch (error) {
    console.error("Failed to delete calendar event", error);
    return jsonResponse({ error: "Unable to delete event." }, 500);
  }
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

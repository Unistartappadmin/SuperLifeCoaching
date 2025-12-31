import { google } from "googleapis";
import type { OAuth2Client, Credentials } from "google-auth-library";
import { randomUUID } from "node:crypto";
import { addDays, addMinutes } from "date-fns";
import { createSupabaseServiceRoleClient } from "./supabase";
import type { Tables, TablesInsert } from "../types/database";

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];
const TIMEZONE = "Europe/London";
const SLOT_INTERVAL_MINUTES = 60; // Changed from 15 to 60 minutes
const PROVIDER_KEY = "google-calendar";
const TOKEN_TYPE = "oauth";

const SITE_URL =
  resolveEnv("PUBLIC_SITE_URL") ??
  (typeof window === "undefined" ? "http://localhost:4321" : window.location.origin);
const DEFAULT_REDIRECT_URI =
  resolveEnv("GOOGLE_REDIRECT_URI") ?? `${SITE_URL}/api/calendar/callback`;

type IntegrationTokenRow = Tables<"integration_tokens">;

export type CalendarSlot = {
  start: string;
  end: string;
  label: string;
  timezone: string;
};

export type CalendarEventInput = {
  summary: string;
  description?: string;
  start: string;
  end: string;
  timezone?: string;
  attendees?: Array<{ email: string; displayName?: string }>;
  metadata?: Record<string, string | number | boolean>;
};

export type CalendarEventUpdate = Partial<Omit<CalendarEventInput, "start" | "end">> & {
  start?: string;
  end?: string;
};

export async function getGoogleAuthUrl(options?: {
  state?: string;
  redirectUri?: string;
}): Promise<string> {
  const client = getOAuthClient(options?.redirectUri);
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SCOPES,
    state: options?.state,
  });
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri?: string,
): Promise<void> {
  const client = getOAuthClient(redirectUri);
  const { tokens } = await client.getToken(code);
  await storeTokens(tokens);
}

export async function getStoredTokens(): Promise<IntegrationTokenRow | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("integration_tokens")
    .select("*")
    .eq("provider", PROVIDER_KEY)
    .eq("token_type", TOKEN_TYPE)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export async function createCalendarEvent(input: CalendarEventInput) {
  const { calendar, auth } = await ensureCalendar();

  const event = await calendar.events.insert({
    calendarId: getCalendarId(),
    auth,
    requestBody: {
      summary: input.summary,
      description: input.description,
      start: {
        dateTime: input.start,
        timeZone: input.timezone ?? TIMEZONE,
      },
      end: {
        dateTime: input.end,
        timeZone: input.timezone ?? TIMEZONE,
      },
      attendees: input.attendees,
      extendedProperties: input.metadata
        ? { private: toStringRecord(input.metadata) }
        : undefined,
    },
  });

  return event.data;
}

export async function updateCalendarEvent(eventId: string, input: CalendarEventUpdate) {
  const { calendar, auth } = await ensureCalendar();
  const { data: existingEvent } = await calendar.events.get({
    calendarId: getCalendarId(),
    auth,
    eventId,
  });

  const updatedEvent = await calendar.events.update({
    calendarId: getCalendarId(),
    auth,
    eventId,
    requestBody: {
      ...existingEvent,
      summary: input.summary ?? existingEvent?.summary ?? undefined,
      description: input.description ?? existingEvent?.description ?? undefined,
      start:
        input.start || input.timezone
          ? {
              dateTime: input.start ?? existingEvent?.start?.dateTime ?? undefined,
              timeZone: input.timezone ?? existingEvent?.start?.timeZone ?? TIMEZONE,
            }
          : existingEvent?.start,
      end:
        input.end || input.timezone
          ? {
              dateTime: input.end ?? existingEvent?.end?.dateTime ?? undefined,
              timeZone: input.timezone ?? existingEvent?.end?.timeZone ?? TIMEZONE,
            }
          : existingEvent?.end,
      attendees: input.attendees ?? existingEvent?.attendees,
      extendedProperties: mergeMetadata(
        existingEvent?.extendedProperties?.private ?? {},
        input.metadata,
      ),
    },
  });

  return updatedEvent.data;
}

export async function deleteCalendarEvent(eventId: string) {
  const { calendar, auth } = await ensureCalendar();
  await calendar.events.delete({
    calendarId: getCalendarId(),
    eventId,
    auth,
  });
}

export async function getAvailableSlots(date: string, durationMinutes: number) {
  if (!date) {
    throw new Error("Date is required to calculate availability.");
  }

  const supabase = createSupabaseServiceRoleClient();
  const targetDay = new Date(`${date}T00:00:00Z`);
  const dayOfWeek = targetDay.getUTCDay();

  const [{ data: availability }, { data: blocked }, { data: bookings }] =
    await Promise.all([
      supabase
        .from("availability_slots")
        .select("*")
        .eq("is_active", true)
        .eq("day_of_week", dayOfWeek),
      supabase.from("blocked_dates").select("*").eq("date", date),
      supabase
        .from("bookings")
        .select("session_time, duration, status")
        .eq("session_date", date)
        .neq("status", "cancelled"),
    ]);

  if (!availability || availability.length === 0) {
    return [];
  }

  if (blocked && blocked.length > 0) {
    return [];
  }

  const bookingWindows = (bookings ?? []).map((booking) => ({
    start: timeToMinutes(booking.session_time),
    end: timeToMinutes(booking.session_time) + booking.duration,
  }));

  const busyWindows = await getCalendarBusyWindows(date);
  const combinedBusy = [...bookingWindows, ...busyWindows];

  const slots: CalendarSlot[] = [];

  for (const slot of availability) {
    const startMinutes = timeToMinutes(slot.start_time);
    const endMinutes = timeToMinutes(slot.end_time);

    for (
      let current = startMinutes;
      current + durationMinutes <= endMinutes;
      current += SLOT_INTERVAL_MINUTES
    ) {
      const next = current + durationMinutes;
      const hasConflict = combinedBusy.some(
        (busy) => overlaps(current, next, busy.start, busy.end),
      );

      if (!hasConflict) {
        const { startIso, endIso, label } = formatSlot(date, current, durationMinutes);
        slots.push({
          start: startIso,
          end: endIso,
          label,
          timezone: "UK Time", // Simplified timezone display
        });
      }
    }
  }

  return slots;
}

export async function getCalendarBusyWindows(date: string) {
  const { calendar, auth } = await ensureCalendar();
  const start = zonedDateTimeToUtc(date, "00:00:00", TIMEZONE);
  const end = addDays(start, 1);

  const response = await calendar.freebusy.query({
    auth,
    requestBody: {
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      timeZone: TIMEZONE,
      items: [{ id: getCalendarId() }],
    },
  });

  const busyPeriods = response.data.calendars?.[getCalendarId()]?.busy ?? [];

  return busyPeriods.map((period) => ({
    start: isoToMinutes(period.start ?? date, date),
    end: isoToMinutes(period.end ?? date, date),
  }));
}

async function ensureCalendar() {
  const tokens = await getStoredTokens();
  if (!tokens?.refresh_token) {
    throw new Error(
      "Missing Google Calendar refresh token. Please complete the OAuth connection.",
    );
  }

  const client = getOAuthClient();
  client.setCredentials({
    refresh_token: tokens.refresh_token ?? undefined,
    access_token: tokens.access_token ?? undefined,
    expiry_date: tokens.expires_at ? new Date(tokens.expires_at).getTime() : undefined,
  });

  client.on("tokens", (newTokens) => {
    storeTokens(newTokens).catch((error) => {
      console.error("Failed to persist refreshed Google tokens", error);
    });
  });

  return {
    auth: client,
    calendar: google.calendar({ version: "v3", auth: client }),
  };
}

async function storeTokens(tokens: Credentials) {
  const supabase = createSupabaseServiceRoleClient();
  const existing = await getStoredTokens();

  const payload: TablesInsert<"integration_tokens"> = {
    id: existing?.id ?? randomUUID(),
    provider: PROVIDER_KEY,
    token_type: TOKEN_TYPE,
    access_token: tokens.access_token ?? existing?.access_token ?? null,
    refresh_token: tokens.refresh_token ?? existing?.refresh_token ?? null,
    expires_at: tokens.expiry_date
      ? new Date(tokens.expiry_date).toISOString()
      : existing?.expires_at ?? null,
    created_at: existing?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("integration_tokens").upsert(payload, {
    onConflict: "provider,token_type",
  });

  if (error) {
    throw error;
  }
}

function getOAuthClient(redirectUri = DEFAULT_REDIRECT_URI): OAuth2Client {
  const clientId = resolveEnv("GOOGLE_CLIENT_ID");
  const clientSecret = resolveEnv("GOOGLE_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials are missing.");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

function getCalendarId() {
  return resolveEnv("GOOGLE_CALENDAR_ID") ?? "primary";
}

function resolveEnv(key: string): string | undefined {
  if (typeof import.meta !== "undefined" && import.meta.env && key in import.meta.env) {
    return import.meta.env[key];
  }

  if (typeof process !== "undefined" && process.env && key in process.env) {
    return process.env[key];
  }

  return undefined;
}

function timeToMinutes(value: string) {
  const [hours, minutes, seconds = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes) + Math.floor(Number(seconds) / 60);
}

function overlaps(startA: number, endA: number, startB: number, endB: number) {
  return Math.max(startA, startB) < Math.min(endA, endB);
}

function formatSlot(date: string, startMinutes: number, durationMinutes: number) {
  const hours = Math.floor(startMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (startMinutes % 60).toString().padStart(2, "0");

  const startDate = zonedDateTimeToUtc(date, `${hours}:${minutes}:00`, TIMEZONE);
  const endDate = addMinutes(startDate, durationMinutes);

  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();
  const label = formatTimeInTimezone(startDate, TIMEZONE);

  return { startIso, endIso, label };
}

function isoToMinutes(iso: string, date: string) {
  const utcDate = new Date(iso);
  const dayStartUtc = zonedDateTimeToUtc(date, "00:00:00", TIMEZONE);
  const diffMs = utcDate.getTime() - dayStartUtc.getTime();
  return Math.floor(diffMs / 60000);
}

function formatTimeInTimezone(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function zonedDateTimeToUtc(dateStr: string, time: string, timeZone: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes, seconds = "0"] = time.split(":");
  const approxUtc = Date.UTC(
    Number.isFinite(year) ? year : 0,
    (Number.isFinite(month) ? month : 1) - 1,
    Number.isFinite(day) ? day : 1,
    Number(hours),
    Number(minutes),
    Number(seconds),
  );

  const offsetMinutes = getTimeZoneOffsetMinutes(new Date(approxUtc), timeZone);
  return new Date(approxUtc - offsetMinutes * 60 * 1000);
}

function getTimeZoneOffsetMinutes(date: Date, timeZone: string) {
  const parts = getTimeParts(date, timeZone);
  const zonedTime = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return (zonedTime - date.getTime()) / 60000;
}

function getTimeParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const lookup: Record<string, string> = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") {
      lookup[part.type] = part.value;
    }
  }

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour),
    minute: Number(lookup.minute),
    second: Number(lookup.second ?? "0"),
  };
}

function toStringRecord(
  metadata: Record<string, string | number | boolean>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [key, String(value)]),
  );
}

function mergeMetadata(
  existing: Record<string, string>,
  updates?: Record<string, string | number | boolean>,
) {
  if (!updates) return { private: existing };
  return { private: { ...existing, ...toStringRecord(updates) } };
}
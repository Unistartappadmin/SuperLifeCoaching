import type { APIRoute } from "astro";
import { exchangeCodeForTokens } from "../../../lib/google-calendar";
import { supabaseEnv } from "../../../lib/supabase";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  return handleOAuthCallback(request);
};

export const POST: APIRoute = async ({ request }) => {
  return handleOAuthCallback(request);
};

async function handleOAuthCallback(request: Request) {
  const base =
    request.headers.get("origin") ??
    (typeof process !== "undefined" ? process.env.PUBLIC_SITE_URL : undefined) ??
    "http://localhost:4321";
  const url = new URL(request.url, base);
  console.log("[calendar/callback] Query params:", Object.fromEntries(url.searchParams));
  console.log(
    "[calendar/callback] Supabase service role key:",
    maskKey(supabaseEnv.serviceRoleKey),
  );
  let code = url.searchParams.get("code");
  let redirectUri = url.searchParams.get("redirect_uri") ?? undefined;

  if (!code && request.method === "POST") {
    const contentType = request.headers.get("content-type") ?? "";
    console.log("[calendar/callback] POST content-type:", contentType);
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const codeEntry = form.get("code");
      if (codeEntry) {
        code = codeEntry.toString();
      }
      const redirectEntry = form.get("redirect_uri");
      if (redirectEntry) {
        redirectUri = redirectEntry.toString();
      }
    }
  }

  if (!code) {
    return jsonResponse({ error: "Missing OAuth code." }, 400);
  }

  try {
    await exchangeCodeForTokens(code, redirectUri);
    return jsonResponse({ connected: true });
  } catch (error) {
    console.error("Google OAuth callback error", error);
    return jsonResponse({ error: "Unable to complete Google OAuth flow." }, 500);
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function maskKey(key?: string | null) {
  if (!key) return "undefined";
  if (key.length <= 10) return `${key.slice(0, 3)}***`;
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

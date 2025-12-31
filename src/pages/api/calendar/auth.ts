import type { APIRoute } from "astro";
import {
  exchangeCodeForTokens,
  getGoogleAuthUrl,
} from "../../../lib/google-calendar";

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const redirectUri = url.searchParams.get("redirect_uri") ?? undefined;
  const state = url.searchParams.get("state") ?? undefined;

  try {
    const authUrl = await getGoogleAuthUrl({ state, redirectUri });
    return jsonResponse({ authUrl });
  } catch (error) {
    console.error("Google OAuth error", error);
    return jsonResponse({ error: "Unable to generate Google auth URL." }, 500);
  }
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

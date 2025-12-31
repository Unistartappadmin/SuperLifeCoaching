import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";
import type { Database } from "../types/database";

const serverSupabaseUrl = resolveEnv("SUPABASE_URL") ?? resolveEnv("PUBLIC_SUPABASE_URL");
const serverAnonKey = resolveEnv("SUPABASE_ANON_KEY") ?? resolveEnv("PUBLIC_SUPABASE_ANON_KEY");

if (!serverSupabaseUrl || !serverAnonKey) {
  throw new Error("Missing Supabase configuration. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set.");
}

const browserSupabaseUrl = resolveEnv("PUBLIC_SUPABASE_URL") ?? serverSupabaseUrl;
const browserAnonKey = resolveEnv("PUBLIC_SUPABASE_ANON_KEY") ?? serverAnonKey;

const serviceRoleKey = resolveEnv("SUPABASE_SERVICE_ROLE_KEY");

function resolveEnv(key: string): string | undefined {
  if (typeof import.meta !== "undefined" && import.meta.env && key in import.meta.env) {
    return import.meta.env[key];
  }

  if (typeof process !== "undefined" && process.env && key in process.env) {
    return process.env[key];
  }

  return undefined;
}

export type TypedSupabaseClient = SupabaseClient<Database>;

export function createSupabaseBrowserClient(): TypedSupabaseClient {
  if (typeof window === "undefined") {
    throw new Error("createSupabaseBrowserClient should only be used in the browser.");
  }

  return createBrowserClient<Database>(browserSupabaseUrl, browserAnonKey);
}

export function createSupabaseServerClient(cookies: AstroCookies): TypedSupabaseClient {
  return createServerClient<Database>(serverSupabaseUrl, serverAnonKey, {
    cookies: {
      get: (key) => cookies.get(key)?.value,
      set: (key, value, options) => {
        cookies.set(key, value, options);
      },
      remove: (key, options) => {
        cookies.delete(key, options);
      },
    },
  });
}

export function createSupabaseServiceRoleClient(): TypedSupabaseClient {
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required to use the service client.");
  }

  return createClient<Database>(serverSupabaseUrl, serviceRoleKey);
}

export const supabaseEnv = {
  url: serverSupabaseUrl,
  anonKey: serverAnonKey,
  serviceRoleKey,
};

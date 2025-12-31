import { createClient } from "@supabase/supabase-js";
import { performance } from "node:perf_hooks";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.");
  process.exit(1);
}

const client = createClient(url, serviceRoleKey ?? anonKey);

async function main() {
  console.log("Pinging Supabase Auth endpoint...");
  const start = performance.now();

  const { data, error } = await client.auth.getSession();
  if (error) {
    throw error;
  }

  const elapsed = Math.round(performance.now() - start);
  console.log(`Supabase reachable. Session available: ${Boolean(data.session)} (${elapsed}ms)`);
}

main().catch((error) => {
  console.error("Supabase connection test failed:");
  console.error(error);
  process.exit(1);
});

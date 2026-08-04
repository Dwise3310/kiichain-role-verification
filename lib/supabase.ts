import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Client for browser / public reads (respects Row Level Security).
 * Safe to import in client components.
 */
export const supabasePublic = createClient(url, anonKey, {
  auth: { persistSession: false },
});

/**
 * Server-only client using the service role key. Bypasses RLS.
 * NEVER import this in a "use client" component or expose it to the browser.
 */
export function supabaseAdmin() {
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

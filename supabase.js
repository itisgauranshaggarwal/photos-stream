import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * true once real Supabase credentials are present in .env
 * (guards against the default placeholder values).
 */
export const isConfigured = Boolean(
  url && key &&
  !url.includes("YOUR-PROJECT") &&
  !key.includes("YOUR-ANON")
);

/** Single shared Supabase client (null until configured). */
export const supabase = isConfigured
  ? createClient(url, key, { auth: { persistSession: true } })
  : null;

/** Show the config banner whenever credentials are missing. */
export function showConfigWarningIfMissing() {
  const banner = document.getElementById("config-banner");
  if (banner) banner.hidden = isConfigured;
}
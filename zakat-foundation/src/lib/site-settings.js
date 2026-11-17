import useSWR from "swr";
import { supabase } from "./supabase";

export const PUBLIC_SETTINGS_KEY = "site-settings-public";

export async function getPublicSiteSettings() {
  const { data, error } = await supabase
    .from("site_settings")
    .select("key,value")
    .eq("is_public", true);

  if (error) throw error;
  return Object.fromEntries((data ?? []).map(({ key, value }) => [key, value]));
}

export function usePublicSiteSettings() {
  return useSWR(PUBLIC_SETTINGS_KEY, getPublicSiteSettings, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 60_000,
  });
}

export function settingText(value, fallback = "") {
  if (typeof value === "string") return value;
  return value == null ? fallback : String(value);
}

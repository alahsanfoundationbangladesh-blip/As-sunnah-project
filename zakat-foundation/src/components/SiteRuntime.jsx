import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { usePublicSiteSettings, settingText } from "../lib/site-settings";
import { supabase } from "../lib/supabase";

export default function SiteRuntime() {
  const { pathname } = useLocation();
  const { data: settings } = usePublicSiteSettings();
  const trackedPath = useRef("");

  useEffect(() => {
    const isPrivateRoute = pathname.startsWith("/admin") || pathname.startsWith("/auth");
    if (isPrivateRoute) return;

    const siteName = settingText(settings?.site_name, "As-Sunnah Foundation");
    document.title = siteName;

    const color = settingText(settings?.brand_color, "#368547");
    if (window.CSS?.supports?.("color", color)) {
      document.documentElement.style.setProperty("--brand-green", color);
    }
  }, [pathname, settings]);

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/auth") || trackedPath.current === pathname) return;
    trackedPath.current = pathname;

    supabase.from("site_page_views").insert({ path: pathname }).then(({ error }) => {
      if (error) trackedPath.current = "";
    });
  }, [pathname]);

  return null;
}

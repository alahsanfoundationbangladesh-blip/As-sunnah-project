import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { usePublicSiteSettings, settingText } from "../lib/site-settings";
import { supabase } from "../lib/supabase";

const pageTitles = {
  "/about": "আমাদের সম্পর্কে",
  "/project": "আমাদের প্রকল্প",
  "/donor": "দাতা সদস্য",
  "/gallery": "ছবির গ্যালারি",
  "/video": "ভিডিও",
  "/volreg": "স্বেচ্ছাসেবক নিবন্ধন",
  "/news": "সংবাদ ও আপডেট",
  "/contact": "যোগাযোগ",
  "/login": "লগইন",
  "/account": "আমার হিসাব",
  "/donation": "অনুদান",
  "/donation_cart": "অনুদানের বিবরণ",
  "/cal_zakat": "যাকাত হিসাব",
  "/term": "শর্তাবলি",
  "/privacy": "গোপনীয়তা নীতি",
};

export default function SiteRuntime() {
  const { pathname } = useLocation();
  const { data: settings } = usePublicSiteSettings();
  const trackedPath = useRef("");

  useEffect(() => {
    document.documentElement.lang = "bn";
    const isPrivateRoute = pathname.startsWith("/admin") || pathname.startsWith("/auth");
    if (isPrivateRoute) return;

    const siteName = settingText(settings?.site_name, "আল আহসান ফাউন্ডেশন বাংলাদেশ");
    const homeHeading = settingText(settings?.home_heading, "মানবিকতার পাশে, মানুষের কল্যাণে");
    const isContentDetail = pathname.startsWith("/articles/") || pathname.startsWith("/pages/") || pathname === "/singlenews";
    if (!isContentDetail) {
      const pageTitle = pathname === "/" ? homeHeading : pageTitles[pathname];
      document.title = pageTitle ? `${pageTitle} | ${siteName}` : siteName;
    }

    if (pathname === "/") {
      const description = settingText(settings?.home_description, "শিক্ষা, দক্ষতা উন্নয়ন ও মানবিক সহায়তায় মানুষের পাশে।");
      let descriptionTag = document.querySelector('meta[name="description"]');
      if (!descriptionTag) {
        descriptionTag = document.createElement("meta");
        descriptionTag.name = "description";
        document.head.appendChild(descriptionTag);
      }
      descriptionTag.content = description;
    }

    const color = settingText(settings?.brand_color, "#145b46");
    if (window.CSS?.supports?.("color", color)) {
      document.documentElement.style.setProperty("--brand-green", color);
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color);
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

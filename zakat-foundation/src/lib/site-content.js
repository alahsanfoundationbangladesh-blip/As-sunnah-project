import { supabase } from "./supabase";

export const CONTENT_FIELDS = "id,slug,content_type,title,summary,body,image_url,video_url,category,tags,status,is_featured,is_breaking,scheduled_at,published_at,seo_title,seo_description,seo_keywords,og_image_url,metadata,created_at,updated_at";

export async function getPublishedContent(contentType, limit = 50) {
  let query = supabase
    .from("site_content")
    .select(CONTENT_FIELDS)
    .in("status", ["published", "scheduled"])
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (contentType) query = query.eq("content_type", contentType);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export function getVideoEmbedUrl(source) {
  if (!source) return "";

  try {
    const url = new URL(source);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.slice(1);
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : "";
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname.startsWith("/embed/")) return source;
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : "";
    }

    if (host === "vimeo.com") {
      const id = url.pathname.split("/").filter(Boolean).pop();
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : "";
    }
  } catch {
    return "";
  }

  return "";
}

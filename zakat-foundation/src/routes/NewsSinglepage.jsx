import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import useSWR from "swr";
import Topheader from "../components/Topheader";
import { CONTENT_FIELDS } from "../lib/site-content";
import { supabase } from "../lib/supabase";

async function getNews(slug) {
  let query = supabase.from("site_content").select(CONTENT_FIELDS).eq("content_type", "news").in("status", ["published", "scheduled"]).order("published_at", { ascending: false, nullsFirst: false });
  if (slug) query = query.eq("slug", slug).maybeSingle();
  else query = query.limit(1).maybeSingle();
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export default function NewsSinglepage() {
  const [searchParams] = useSearchParams();
  const slug = searchParams.get("slug");
  const { data, error, isLoading } = useSWR(["public-news-detail", slug], () => getNews(slug));

  useEffect(() => {
    if (!data) return;
    document.title = data.seo_title || data.title;
    const description = data.seo_description || data.summary;
    if (!description) return;
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.name = "description";
      document.head.appendChild(tag);
    }
    tag.content = description;
  }, [data]);

  return (
    <>
      <Topheader />
      <main className="main_news_cont">
        <div className="news_single">
          <Link to="/news" className="cms-detail-back">← All news</Link>
          {isLoading ? <p role="status">Loading news article…</p> : error ? <p role="alert">This news article could not be loaded.</p> : !data ? <p>This news article is not available.</p> : (
            <article>
              <h1>{data.title}</h1>
              {data.published_at && <time dateTime={data.published_at}>{new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(data.published_at))}</time>}
              {data.image_url && <img src={data.image_url} alt={data.title} loading="lazy" />}
              {data.summary && <p>{data.summary}</p>}
              {data.body && <p className="cms-detail-body">{data.body}</p>}
            </article>
          )}
        </div>
      </main>
    </>
  );
}

import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import useSWR from "swr";
import Topheader from "../components/Topheader";
import { CONTENT_FIELDS } from "../lib/site-content";
import { supabase } from "../lib/supabase";

async function fetchContent({ type, slug }) {
  const { data, error } = await supabase
    .from("site_content")
    .select(CONTENT_FIELDS)
    .eq("content_type", type)
    .eq("slug", slug)
    .in("status", ["published", "scheduled"])
    .maybeSingle();
  if (error) throw error;
  return data;
}

export default function ContentDetail({ contentType }) {
  const { slug } = useParams();
  const { data, error, isLoading } = useSWR(["public-content-detail", contentType, slug], () => fetchContent({ type: contentType, slug }));

  useEffect(() => {
    if (!data) return;
    document.title = data.seo_title || data.title;
    const description = data.seo_description || data.summary;
    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement("meta");
        tag.name = "description";
        document.head.appendChild(tag);
      }
      tag.content = description;
    }
  }, [data]);

  return (
    <>
      <Topheader />
      <main className="cms-detail-page">
        <div className="cms-detail-inner">
          <Link to="/" className="cms-detail-back">← Back to website</Link>
          {isLoading ? <p className="cms-detail-status" role="status">Loading published content…</p> : error ? <p className="cms-detail-status" role="alert">This content could not be loaded. Please try again later.</p> : !data ? <p className="cms-detail-status">This page is not available.</p> : (
            <article className="cms-detail-article">
              {data.category && <span className="cms-detail-category">{data.category}</span>}
              <h1>{data.title}</h1>
              {data.published_at && <time dateTime={data.published_at}>{new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(data.published_at))}</time>}
              {data.image_url && <img className="cms-detail-cover" src={data.image_url} alt={data.title} />}
              {data.summary && <p className="cms-detail-summary">{data.summary}</p>}
              {data.body && <div className="cms-detail-body">{data.body}</div>}
              {data.tags?.length > 0 && <ul className="cms-detail-tags" aria-label="Topics">{data.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>}
            </article>
          )}
        </div>
      </main>
    </>
  );
}

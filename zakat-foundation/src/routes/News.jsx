import useSWR from "swr";
import Topheader from "../components/Topheader";
import { Link } from "react-router-dom";
import { getPublishedContent } from "../lib/site-content";

export default function News() {
  const { data: news = [], error, isLoading } = useSWR(
    ["public-site-content", "news"],
    () => getPublishedContent("news", 100),
  );

  return (
    <>
      <Topheader />
      <main className="mainNewsContainer">
        <h1>News</h1>
        {error && <p role="alert">News could not be loaded right now. Please try again later.</p>}
        {isLoading ? <p role="status">Loading published news…</p> : (
          <div className="newsContainer">
            {news.map((item) => (
              <Link key={item.id} to={`/singlenews?slug=${encodeURIComponent(item.slug)}`}>
                <article className="cards">
                  <h2>{item.title}</h2>
                  {item.image_url && <img src={item.image_url} alt={item.title} loading="lazy" />}
                  <p className="description">{item.summary || item.body}</p>
                </article>
              </Link>
            ))}
            {!error && news.length === 0 && <p>No news articles have been published yet.</p>}
          </div>
        )}
      </main>
    </>
  );
}

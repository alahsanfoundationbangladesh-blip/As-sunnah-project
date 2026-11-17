import useSWR from "swr";
import { Link } from "react-router-dom";
import { getPublishedContent } from "../lib/site-content";

export default function Latestnews() {
  const { data: latestNews = [], error, isLoading } = useSWR(
    ["public-site-content", "news"],
    () => getPublishedContent("news", 3),
  );

  return (
    <section className="latestNews">
      <h1>Latest News</h1>
      <div className="mainCard">
        {isLoading && <p role="status">Loading latest news…</p>}
        {latestNews.map((item) => (
          <Link key={item.id} to={`/singlenews?slug=${encodeURIComponent(item.slug)}`}>
            <article className="card">
              {item.image_url && <img src={item.image_url} alt={item.title} loading="lazy" />}
              <p>{item.title}</p>
            </article>
          </Link>
        ))}
        {error && <p role="alert">Latest news is temporarily unavailable.</p>}
        {!isLoading && !error && latestNews.length === 0 && <p>No news has been published yet.</p>}
      </div>
      <div className="moreBtn">
        <Link to="/news"><button className="more">More</button></Link>
      </div>
    </section>
  );
}

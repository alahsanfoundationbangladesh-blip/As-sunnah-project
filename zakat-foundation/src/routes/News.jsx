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
        <h1>সংবাদ ও আপডেট</h1>
        {error && <p role="alert">এই মুহূর্তে সংবাদ লোড করা যাচ্ছে না। অনুগ্রহ করে পরে আবার চেষ্টা করুন।</p>}
        {isLoading ? <p role="status">প্রকাশিত সংবাদ লোড হচ্ছে…</p> : (
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
            {!error && news.length === 0 && <p>এখনো কোনো সংবাদ প্রকাশ করা হয়নি।</p>}
          </div>
        )}
      </main>
    </>
  );
}

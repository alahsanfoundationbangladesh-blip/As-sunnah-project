import useSWR from "swr";
import { Link } from "react-router-dom";
import { getPublishedContent, getVideoEmbedUrl } from "../lib/site-content";

export default function Video() {
  const { data: videos = [], error, isLoading } = useSWR(
    ["public-site-content", "video"],
    () => getPublishedContent("video", 3),
  );

  return (
    <section className="latestVideos">
      <h1>Videos</h1>
      {isLoading && <p role="status">Loading videos…</p>}
      {error && <p role="alert">Videos are temporarily unavailable.</p>}
      <div className="mainVideoSection">
        {videos.map((video) => {
          const embedUrl = getVideoEmbedUrl(video.video_url);
          if (!embedUrl) return null;
          return (
            <article className="card" key={video.id}>
              <iframe
                src={embedUrl}
                title={video.title}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
              <h2>{video.title}</h2>
            </article>
          );
        })}
        {!isLoading && !error && videos.length === 0 && <p>No videos have been published yet.</p>}
      </div>
      <div className="moreBtn"><Link to="/video"><button className="more">More</button></Link></div>
    </section>
  );
}

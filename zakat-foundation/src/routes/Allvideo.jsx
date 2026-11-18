import useSWR from "swr";
import Topheader from "../components/Topheader";
import { getPublishedContent, getVideoEmbedUrl } from "../lib/site-content";

export default function Allvideo() {
  const { data: videos = [], error, isLoading } = useSWR(
    ["public-site-content", "video"],
    () => getPublishedContent("video", 100),
  );

  return (
    <>
      <Topheader />
      <main className="allVideo">
        <h1>Videos</h1>
        {isLoading && <p role="status">Loading published videos…</p>}
        {error && <p role="alert">Videos could not be loaded right now. Please try again later.</p>}
        <div className="allVideoCard">
          {videos.map((video) => {
            const embedUrl = getVideoEmbedUrl(video.video_url);
            if (!embedUrl) return null;
            return (
              <article className="cards" key={video.id}>
                <iframe
                  src={embedUrl}
                  title={video.title}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
                <h2>{video.title}</h2>
                {video.summary && <p>{video.summary}</p>}
              </article>
            );
          })}
          {!isLoading && !error && videos.length === 0 && <p>No videos have been published yet.</p>}
        </div>
      </main>
    </>
  );
}

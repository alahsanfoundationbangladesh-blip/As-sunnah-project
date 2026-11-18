import { Link } from "react-router-dom";
import { usePublicSiteSettings, settingText } from "../lib/site-settings";
import HomeActivities from "../components/HomeActivities";
import HomeOverview from "../components/HomeOverview";
import "../components/home.css";

export default function Home() {
  const { data: settings } = usePublicSiteSettings();
  const value = (key, fallback) => settingText(settings?.[key], fallback);

  return (
    <main className="bangla-home">
      <HomeOverview settings={settings} />
      <HomeActivities settings={settings} />
      <section className="home-closing" aria-labelledby="home-closing-title">
        <div className="home-closing-inner">
          <div>
            <h2 id="home-closing-title">{value("home_closing_title", "আপনার সহায়তায় এগিয়ে যাবে মানুষের কল্যাণ")}</h2>
            <p>{value("home_closing_description", "একটি আন্তরিক সহায়তাও কারও জীবনে আশার আলো হয়ে উঠতে পারে। আজই আমাদের সঙ্গে যুক্ত হোন।")}</p>
          </div>
          <Link className="home-button home-button-primary" to="/donation">{value("home_closing_cta_label", "সহায়তার হাত বাড়ান")}<span aria-hidden="true">↗</span></Link>
        </div>
      </section>
    </main>
  );
}

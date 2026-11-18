import { Link } from "react-router-dom";
import { settingText } from "../lib/site-settings";

const defaults = {
  eyebrow: "সেবা · শিক্ষা · মানবিকতা",
  heading: "মানবিকতার পাশে, মানুষের কল্যাণে",
  description: "শিক্ষা, দক্ষতা উন্নয়ন ও মানবিক সহায়তার মাধ্যমে মানুষের পাশে দাঁড়াতে আমাদের সঙ্গে যুক্ত হোন। আপনার সহায়তা পৌঁছে যাক প্রয়োজনের সময়ে, প্রয়োজনীয় মানুষের কাছে।",
  image: "/images/header.png",
  imageAlt: "দক্ষতা উন্নয়ন প্রশিক্ষণে অংশগ্রহণকারীরা",
  donateLabel: "দান করুন",
  activitiesLabel: "আমাদের কার্যক্রম",
};

export default function HomeOverview({ settings }) {
  const value = (key, fallback) => settingText(settings?.[key], fallback);

  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero-inner">
        <div className="home-hero-copy">
          <p className="home-eyebrow"><span aria-hidden="true" />{value("home_eyebrow", defaults.eyebrow)}</p>
          <h1 id="home-hero-title">{value("home_heading", defaults.heading)}</h1>
          <p className="home-hero-description">{value("home_description", defaults.description)}</p>
          <div className="home-hero-actions">
            <Link className="home-button home-button-primary" to="/donation">{value("home_primary_cta_label", defaults.donateLabel)}<span aria-hidden="true">↗</span></Link>
            <a className="home-button home-button-secondary" href="#activities">{value("home_secondary_cta_label", defaults.activitiesLabel)}</a>
          </div>
        </div>
        <div className="home-hero-visual">
          <div className="home-hero-image-wrap">
            <img
              src={value("home_hero_image_url", defaults.image) || defaults.image}
              alt={value("home_hero_image_alt", defaults.imageAlt) || defaults.imageAlt}
              onError={(event) => { event.currentTarget.style.visibility = "hidden"; }}
            />
          </div>
          <div className="home-image-caption">
            <span className="home-image-caption-mark" aria-hidden="true">আ</span>
            <p>{value("home_image_caption", "মানুষের পাশে, কল্যাণের পথে") || "মানুষের পাশে, কল্যাণের পথে"}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

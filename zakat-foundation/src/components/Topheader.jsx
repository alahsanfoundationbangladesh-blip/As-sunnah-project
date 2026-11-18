import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import { Link } from "react-router-dom";
import { usePublicSiteSettings, settingText } from "../lib/site-settings";
import "./home.css";

const links = [
  { to: "/", label: "হোম" },
  { to: "/about", label: "আমাদের সম্পর্কে" },
  { to: "/#activities", label: "কার্যক্রম" },
  { to: "/news", label: "সংবাদ" },
  { to: "/gallery", label: "ছবির গ্যালারি" },
  { to: "/contact", label: "যোগাযোগ" },
];

export default function Topheader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: siteSettings } = usePublicSiteSettings();
  const logoUrl = settingText(siteSettings?.logo_url, "");
  const siteName = settingText(siteSettings?.site_name, "আল আহসান ফাউন্ডেশন বাংলাদেশ");

  return (
    <header className="site-header-bn">
      <div className="site-header-inner">
        <Link className="site-brand-bn" to="/" aria-label={`${siteName} — হোম`} onClick={() => setMenuOpen(false)}>
          {logoUrl ? (
            <img className="site-brand-logo-bn" src={logoUrl} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} />
          ) : (
            <span className="site-brand-mark-bn" aria-hidden="true">আ</span>
          )}
          <span className="site-brand-name-bn">{siteName}</span>
        </Link>

        <button
          type="button"
          className="site-nav-toggle-bn"
          aria-label={menuOpen ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
          aria-expanded={menuOpen}
          aria-controls="public-site-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
        </button>

        <nav id="public-site-navigation" className={`site-nav-bn${menuOpen ? " is-open" : ""}`} aria-label="প্রধান নেভিগেশন">
          {links.map(({ to, label }) => (
            <Link key={to} to={to} onClick={() => setMenuOpen(false)}>{label}</Link>
          ))}
          <Link className="site-nav-donate-bn" to="/donation" onClick={() => setMenuOpen(false)}>
            {settingText(siteSettings?.home_primary_cta_label, "দান করুন")} <span aria-hidden="true">↗</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

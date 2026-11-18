import { Link } from "react-router-dom";
import { usePublicSiteSettings, settingText } from "../lib/site-settings";
import "./home.css";

export default function Footer() {
  const { data: settings } = usePublicSiteSettings();
  const siteName = settingText(settings?.site_name, "আল আহসান ফাউন্ডেশন বাংলাদেশ");
  const description = settingText(settings?.footer_description, "শিক্ষা, দক্ষতা উন্নয়ন ও মানবিক সহায়তায় মানুষের পাশে।");

  return (
    <footer className="site-footer-bn">
      <div className="site-footer-inner-bn">
        <div>
          <p className="site-footer-brand-bn">{siteName}</p>
          <p className="site-footer-copy-bn">{description} © {new Intl.NumberFormat("bn-BD").format(new Date().getFullYear())} — সর্বস্বত্ব সংরক্ষিত।</p>
        </div>
        <nav className="site-footer-links-bn" aria-label="আইনি তথ্য">
          <Link to="/term">শর্তাবলি</Link>
          <Link to="/privacy">গোপনীয়তা নীতি</Link>
        </nav>
      </div>
    </footer>
  );
}

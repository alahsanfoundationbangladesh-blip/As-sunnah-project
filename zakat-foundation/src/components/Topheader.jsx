import { useRef } from "react";
import { IoMail, IoMenu } from "react-icons/io5";
import { FaFacebookF, FaYoutube } from "react-icons/fa6";
import { FaPhoneAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import { RxCross2 } from "react-icons/rx";
import { usePublicSiteSettings, settingText } from "../lib/site-settings";
export default function Topheader() {
  const navItem = useRef(null);
  const { data: siteSettings } = usePublicSiteSettings();
  const logoUrl = settingText(siteSettings?.logo_url, "/images/logo.png") || "/images/logo.png";
  const siteName = settingText(siteSettings?.site_name, "As-Sunnah Foundation");
  const openMenu = () => {
    navItem.current.style.left = "0";
  };
  const closeMenu = () => {
    navItem.current.style.left = "-45rem";
  };
  return (
    <>
      <section className="mainTopHeader">
        <div className="firstSec">
          <div className="socialIcons">
            <ul>
              <li style={{ background: "#0165E1" }}>
                <a href="">
                  <FaFacebookF />
                </a>
              </li>
              <li style={{ background: "#ff0000" }}>
                <a href="">
                  <FaYoutube />
                </a>
              </li>
              <li style={{ background: "#EA4335" }}>
                <a href="">
                  <IoMail />
                </a>
              </li>
              <li style={{ background: "#34A853" }}>
                <a href="">
                  <FaPhoneAlt />
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="secondSec">
          <div className="logo">
          <Link to={"/"}> <img src={logoUrl} alt={siteName} id="logoTwo" />
              <img src={logoUrl} alt={siteName} id="logo" />
            </Link>
          </div>
          <div className="topButton">
            <button>
              <Link style={{ color: "white", textDecoration:"none"}} to={"/login"}>
              Account

              </Link>
            </button>
            <button>
              <Link style={{ color: "white", textDecoration: "none" }} to={`/donation`}>
              Donate

              </Link>

            </button>
          </div>
        </div>
      </section>
      <nav >
        <div id="hiddenMenu">
          <h1 onClick={openMenu}>
            <IoMenu />
          </h1>
        </div>
        <ul ref={navItem}>
          <h4 onClick={closeMenu} id="hiddenCross">
            <RxCross2 />
          </h4>
          <li>
            <Link to={`/`}>Home</Link>
          </li>
          {/* <li>
            <Link to={`/account`}>Profile</Link>
          </li> */}
          <li>
            <Link to={`/donation`}>Donations</Link>
          </li>
          <li>
            <Link to={`/`}>Donations Projects</Link>
          </li>
          <li>
            <Link to={`/about`}>About</Link>
          </li>
          <li>
            <Link to={`/project`}>Project</Link>
          </li>
          <li>
            <Link to={`/donor`}>Donor and lifetime Me</Link>
          </li>
          <li>
            <Link to={`/gallery`}>Gallery</Link>
          </li>
          <li>
            <Link to={`/video`}>Videos</Link>
          </li>
          <li>
            <Link to={`/volreg`}>volunteer registration</Link>
          </li>
          <li>
            <Link to={`/news`}>News</Link>
          </li>
          <li>
            <Link to={`/contact`}>Contact</Link>
          </li>

        </ul>
      </nav>
    </>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiActivity,
  FiBarChart2,
  FiFileText,
  FiGrid,
  FiImage,
  FiLogOut,
  FiMenu,
  FiSettings,
  FiUsers,
  FiVideo,
  FiUser,
  FiX,
} from "react-icons/fi";
import AdminOverview from "./AdminOverview";
import ContentManager from "./ContentManager";
import MediaLibrary from "./MediaLibrary";
import SettingsPanel from "./SettingsPanel";
import TeamPanel from "./TeamPanel";
import AnalyticsPanel from "./AnalyticsPanel";
import ActivityPanel from "./ActivityPanel";
import UserManagementPanel from "./UserManagementPanel";

const navigation = [
  { id: "overview", label: "Overview", icon: FiGrid },
  { id: "content", label: "Pages & articles", icon: FiFileText },
  { id: "news", label: "News", icon: FiFileText },
  { id: "videos", label: "Videos", icon: FiVideo },
  { id: "media", label: "Media library", icon: FiImage },
  { id: "analytics", label: "Analytics", icon: FiBarChart2 },
  { id: "users", label: "Users", icon: FiUser },
  { id: "team", label: "Admin team", icon: FiUsers },
  { id: "settings", label: "Website settings", icon: FiSettings },
  { id: "activity", label: "Activity log", icon: FiActivity },
];

const pageTitles = {
  overview: ["Dashboard", "Overview"],
  content: ["Content", "Pages and articles"],
  news: ["Content", "News management"],
  videos: ["Content", "Video library"],
  media: ["Library", "Media library"],
  analytics: ["Insights", "Website analytics"],
  users: ["Account management", "Registered users"],
  team: ["Access control", "Admin team"],
  settings: ["Configuration", "Website settings"],
  activity: ["Security", "Activity log"],
};

export default function AdminShell({ user, onLogout }) {
  const [activePage, setActivePage] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [isRoot, setIsRoot] = useState(false);
  const [rootChecked, setRootChecked] = useState(false);
  const [access, setAccess] = useState(null);
  const [accessChecked, setAccessChecked] = useState(false);
  const [contentFilter, setContentFilter] = useState("article");

  useEffect(() => {
    let active = true;
    import("../lib/supabase").then(({ supabase }) => Promise.all([
      supabase.rpc("is_root_super_admin"),
      supabase.rpc("has_admin_permission", { p_permission: "settings.manage" }),
    ])).then(([rootResult, accessResult]) => {
      if (!active) return;
      setIsRoot(Boolean(rootResult.data));
      setAccess(Boolean(accessResult.data));
      setRootChecked(true);
      setAccessChecked(true);
    }).catch(() => {
      if (!active) return;
      setRootChecked(true);
      setAccessChecked(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const [eyebrow, title] = pageTitles[activePage] ?? pageTitles.overview;
  const renderPage = () => {
    if (activePage === "overview") return <AdminOverview onNavigate={setActivePage} />;
    if (activePage === "content") return <ContentManager filterType={contentFilter} onNotice={setNotice} user={user} />;
    if (activePage === "news") return <ContentManager filterType="news" onNotice={setNotice} user={user} />;
    if (activePage === "videos") return <ContentManager filterType="video" onNotice={setNotice} user={user} />;
    if (activePage === "media") return <MediaLibrary onNotice={setNotice} user={user} />;
    if (activePage === "analytics") return <AnalyticsPanel />;
    if (activePage === "users") return <UserManagementPanel isRoot={isRoot} rootChecked={rootChecked} onNotice={setNotice} />;
    if (activePage === "team") return <TeamPanel user={user} isRoot={isRoot} rootChecked={rootChecked} onNotice={setNotice} />;
    if (activePage === "settings") return <SettingsPanel user={user} canManage={access} accessChecked={accessChecked} onNotice={setNotice} />;
    return <ActivityPanel />;
  };

  const selectPage = (page) => {
    if (page === "content") setContentFilter("article");
    setActivePage(page);
    setSidebarOpen(false);
  };

  return (
    <div className="admin-layout">
      {sidebarOpen && <button className="admin-sidebar-backdrop" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={`admin-sidebar${sidebarOpen ? " is-open" : ""}`} aria-label="Admin navigation">
        <div className="admin-sidebar-brand">
          <span className="admin-brand-mark">AS</span>
          <span><strong>As-Sunnah</strong><small>FOUNDATION ADMIN</small></span>
          <button className="admin-icon-button admin-sidebar-close" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}><FiX /></button>
        </div>

        <p className="admin-nav-label">WORKSPACE</p>
        <nav className="admin-nav">
          {navigation.filter((item) => item.id !== "users" || (rootChecked && isRoot)).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`admin-nav-item${activePage === id ? " active" : ""}`}
              onClick={() => selectPage(id)}
              aria-current={activePage === id ? "page" : undefined}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
              {id === "overview" && activePage === id && <span className="admin-nav-dot" />}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-security-note">
            <span className="admin-security-pulse" />
            <div><strong>Protected workspace</strong><small>Supabase RLS enabled</small></div>
          </div>
          <Link to="/" className="admin-view-site">View public website <span aria-hidden="true">↗</span></Link>
        </div>
      </aside>

      <div className="admin-main-column">
        <header className="admin-topbar">
          <div className="admin-topbar-leading">
            <button className="admin-icon-button admin-menu-toggle" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><FiMenu /></button>
            <div className="admin-breadcrumb"><span>{eyebrow}</span><span aria-hidden="true">/</span><strong>{title}</strong></div>
          </div>
          <div className="admin-topbar-actions">
            <span className="admin-live-status"><span /> Live data</span>
            <div className="admin-user-chip"><span className="admin-avatar">{(user.email?.[0] ?? "A").toUpperCase()}</span><span className="admin-user-email">{user.email}</span></div>
            <button className="admin-icon-button admin-logout-button" onClick={onLogout} aria-label="Sign out"><FiLogOut /></button>
          </div>
        </header>

        <main className="admin-page-content">
          <div className="admin-page-heading">
            <div><p className="admin-eyebrow">{eyebrow.toUpperCase()}</p><h1>{title}</h1></div>
            {activePage === "content" && (
              <div className="admin-content-type-switch" aria-label="Content type">
                <button className={contentFilter === "page" ? "active" : ""} onClick={() => setContentFilter("page")}>Pages</button>
                <button className={contentFilter === "article" ? "active" : ""} onClick={() => setContentFilter("article")}>Articles</button>
              </div>
            )}
          </div>

          {notice && <div className="admin-toast" role="status">{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")}>×</button></div>}
          {renderPage()}
        </main>
        <footer className="admin-footer"><span>As-Sunnah Foundation</span><span>Secure content workspace</span></footer>
      </div>
    </div>
  );
}

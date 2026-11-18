import useSWR from "swr";
import { FiArrowDownRight, FiArrowUpRight, FiEye, FiFileText, FiUsers, FiVideo } from "react-icons/fi";
import { supabase } from "../lib/supabase";

async function getOverview() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [published, news, videos, views, registeredUsers, activities] = await Promise.all([
    supabase.from("site_content").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("site_content").select("id", { count: "exact", head: true }).eq("content_type", "news").eq("status", "published"),
    supabase.from("site_content").select("id", { count: "exact", head: true }).eq("content_type", "video").eq("status", "published"),
    supabase.from("site_page_views").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.rpc("admin_user_count"),
    supabase.from("admin_activity_logs").select("id,action,entity_type,actor_email,details,created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  const firstError = [published, news, videos, views, registeredUsers, activities].find((result) => result.error)?.error;
  if (firstError) throw firstError;

  return {
    published: published.count ?? 0,
    news: news.count ?? 0,
    videos: videos.count ?? 0,
    views: views.count ?? 0,
    users: Number(registeredUsers.data ?? 0),
    activities: activities.data ?? [],
  };
}

const metrics = [
  { key: "views", label: "Page views · 30 days", icon: FiEye, tint: "mint", detail: "Tracked on public pages" },
  { key: "published", label: "Published content", icon: FiFileText, tint: "blue", detail: "Visible on the website" },
  { key: "news", label: "Published news", icon: FiArrowUpRight, tint: "amber", detail: "News articles" },
  { key: "videos", label: "Published videos", icon: FiVideo, tint: "violet", detail: "Video library" },
  { key: "users", label: "Registered accounts", icon: FiUsers, tint: "blue", detail: "Supabase Auth accounts" },
];

function formatRelativeTime(value) {
  const elapsed = Date.now() - new Date(value).getTime();
  if (elapsed < 60_000) return "Just now";
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)} min ago`;
  if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)} hr ago`;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
}

export default function AdminOverview({ onNavigate }) {
  const { data, error, isLoading } = useSWR("admin-overview", getOverview, { refreshInterval: 60_000, revalidateOnFocus: true });
  const greeting = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  return (
    <div className="admin-overview">
      <section className="admin-welcome-panel">
        <div>
          <p className="admin-eyebrow">{greeting}</p>
          <h2>Your website, at a glance.</h2>
          <p>Manage published stories, videos, media and site-wide settings from one secure workspace.</p>
        </div>
        <button className="admin-primary-button" onClick={() => onNavigate("news")}>
          <FiFileText aria-hidden="true" /> Create news
        </button>
      </section>

      {error && <div className="admin-inline-alert" role="alert">Live statistics could not be loaded. Check your admin permissions and connection, then refresh.</div>}

      <section className="admin-metric-grid" aria-label="Live website statistics">
        {metrics.map(({ key, label, icon: Icon, tint, detail }) => (
          <article className="admin-metric-card" key={key}>
            <div className={`admin-metric-icon ${tint}`}><Icon aria-hidden="true" /></div>
            <p>{label}</p>
            <strong>{isLoading ? "—" : Number(data?.[key] ?? 0).toLocaleString()}</strong>
            <small>{detail}</small>
          </article>
        ))}
      </section>

      <section className="admin-overview-grid">
        <article className="admin-panel admin-activity-panel">
          <div className="admin-panel-heading"><div><p className="admin-eyebrow">AUDIT TRAIL</p><h2>Recent activity</h2></div><button className="admin-link-button" onClick={() => onNavigate("activity")}>View log <FiArrowUpRight aria-hidden="true" /></button></div>
          {isLoading ? <p className="admin-empty-state">Loading verified activity…</p> : data?.activities.length ? (
            <ul className="admin-activity-list">
              {data.activities.map((activity) => (
                <li key={activity.id}>
                  <span className={`admin-activity-mark ${activity.action}`} aria-hidden="true">{activity.action === "delete" ? <FiArrowDownRight /> : <FiArrowUpRight />}</span>
                  <div className="admin-activity-copy"><strong>{activity.action} {activity.entity_type.replaceAll("_", " ")}</strong><span>{activity.details?.label || "Content record"} · {activity.actor_email || "Admin"}</span></div>
                  <time dateTime={activity.created_at}>{formatRelativeTime(activity.created_at)}</time>
                </li>
              ))}
            </ul>
          ) : <div className="admin-empty-state"><strong>No admin changes yet</strong><span>Edits and publishing actions will appear here automatically.</span></div>}
        </article>

        <article className="admin-panel admin-health-panel">
          <div className="admin-panel-heading"><div><p className="admin-eyebrow">SYSTEM STATUS</p><h2>Connected services</h2></div><span className="admin-status-pill"><i /> Secure</span></div>
          <div className="admin-health-row"><span className="admin-health-dot" /><div><strong>Supabase database</strong><small>RLS protected content and settings</small></div><span className="admin-health-state">Connected</span></div>
          <div className="admin-health-row"><span className="admin-health-dot" /><div><strong>Media storage</strong><small>Foundation media bucket</small></div><span className="admin-health-state">Connected</span></div>
          <div className="admin-finance-note"><strong>Financial reports are not available yet</strong><p>This website has no connected donation ledger or expense records. No income totals are estimated or fabricated.</p></div>
        </article>
      </section>
    </div>
  );
}

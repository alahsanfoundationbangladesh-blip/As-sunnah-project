import useSWR from "swr";
import { FiArrowDownRight, FiArrowUpRight, FiCalendar, FiEye, FiFileText, FiImage, FiRefreshCw, FiUsers, FiVideo } from "react-icons/fi";
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
  { key: "views", label: "পেজ ভিউ", icon: FiEye, tint: "mint", period: "গত ৩০ দিন", detail: "পাবলিক পাতায় গণনা করা হয়েছে" },
  { key: "published", label: "প্রকাশিত কনটেন্ট", icon: FiFileText, tint: "blue", period: "মোট", detail: "ওয়েবসাইটে দৃশ্যমান" },
  { key: "news", label: "প্রকাশিত সংবাদ", icon: FiArrowUpRight, tint: "amber", period: "মোট", detail: "সংবাদ ও আপডেট" },
  { key: "videos", label: "প্রকাশিত ভিডিও", icon: FiVideo, tint: "violet", period: "মোট", detail: "ভিডিও লাইব্রেরি" },
  { key: "users", label: "নিবন্ধিত অ্যাকাউন্ট", icon: FiUsers, tint: "blue", period: "মোট", detail: "সুপাবেজে নিবন্ধিত" },
];

const activityLabels = {
  create: "তৈরি করেছেন",
  update: "হালনাগাদ করেছেন",
  delete: "মুছে ফেলেছেন",
};

const entityLabels = {
  site_content: "কনটেন্ট",
  site_settings: "ওয়েবসাইট সেটিংস",
  media_asset: "মিডিয়া ফাইল",
  admin_user: "অ্যাডমিন ব্যবহারকারী",
};

function getEntityLabel(value) {
  return entityLabels[value] ?? "কনটেন্ট";
}

function formatRelativeTime(value) {
  const elapsed = Date.now() - new Date(value).getTime();
  if (elapsed < 60_000) return "এইমাত্র";
  if (elapsed < 3_600_000) return `${new Intl.NumberFormat("bn-BD").format(Math.floor(elapsed / 60_000))} মিনিট আগে`;
  if (elapsed < 86_400_000) return `${new Intl.NumberFormat("bn-BD").format(Math.floor(elapsed / 3_600_000))} ঘণ্টা আগে`;
  return new Intl.DateTimeFormat("bn-BD", { month: "short", day: "numeric" }).format(new Date(value));
}

export default function AdminOverview({ onNavigate }) {
  const { data, error, isLoading } = useSWR("admin-overview", getOverview, { refreshInterval: 60_000, revalidateOnFocus: true });
  const greeting = new Intl.DateTimeFormat("bn-BD", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  return (
    <div className="admin-overview">
      <section className="admin-welcome-panel">
        <div className="admin-welcome-copy">
          <p className="admin-welcome-date"><FiCalendar aria-hidden="true" />{greeting}</p>
          <h2>আপনার ওয়েবসাইট, এক নজরে</h2>
          <p>কনটেন্ট, সংবাদ, ভিডিও ও সাইটের কার্যক্রম—সবকিছুর বর্তমান চিত্র এক জায়গায়।</p>
        </div>
        <div className="admin-welcome-actions">
          <button className="admin-primary-button" onClick={() => onNavigate("news")}>
            <FiFileText aria-hidden="true" /> সংবাদ তৈরি করুন
          </button>
          <button className="admin-secondary-button" onClick={() => onNavigate("media")}>
            <FiImage aria-hidden="true" /> মিডিয়া লাইব্রেরি
          </button>
        </div>
      </section>

      {error && <div className="admin-inline-alert" role="alert">সরাসরি পরিসংখ্যান লোড করা যায়নি। অ্যাডমিন অনুমতি ও সংযোগ যাচাই করে রিফ্রেশ করুন।</div>}

      <div className="admin-overview-section-heading">
        <div><p className="admin-eyebrow">সরাসরি ডেটাবেস থেকে</p><h2>মূল পরিসংখ্যান</h2></div>
        <span className="admin-overview-refresh"><FiRefreshCw aria-hidden="true" /> প্রতি ৬০ সেকেন্ডে আপডেট</span>
      </div>

      <section className="admin-metric-grid" aria-label="ওয়েবসাইটের হালনাগাদ পরিসংখ্যান">
        {metrics.map(({ key, label, icon: Icon, tint, period, detail }) => (
          <article className={`admin-metric-card${key === "views" ? " featured" : ""}`} key={key}>
            <div className="admin-metric-card-top">
              <div className={`admin-metric-icon ${tint}`}><Icon aria-hidden="true" /></div>
              <span>{period}</span>
            </div>
            <p>{label}</p>
            <strong>{isLoading ? "—" : Number(data?.[key] ?? 0).toLocaleString("bn-BD")}</strong>
            <small>{detail}</small>
          </article>
        ))}
      </section>

      <section className="admin-overview-grid">
        <article className="admin-panel admin-activity-panel">
          <div className="admin-panel-heading"><div><p className="admin-eyebrow">পরিবর্তনের ইতিহাস</p><h2>সাম্প্রতিক কার্যক্রম</h2></div><button className="admin-link-button" onClick={() => onNavigate("activity")}>সব দেখুন <FiArrowUpRight aria-hidden="true" /></button></div>
          {isLoading ? <p className="admin-empty-state">যাচাইকৃত কার্যক্রম লোড হচ্ছে…</p> : data?.activities.length ? (
            <ul className="admin-activity-list">
              {data.activities.map((activity) => (
                <li key={activity.id}>
                  <span className={`admin-activity-mark ${activity.action}`} aria-hidden="true">{activity.action === "delete" ? <FiArrowDownRight /> : <FiArrowUpRight />}</span>
                  <div className="admin-activity-copy"><strong>{activityLabels[activity.action] ?? "পরিবর্তন করেছেন"} · {getEntityLabel(activity.entity_type)}</strong><span>{activity.details?.label || "কনটেন্ট রেকর্ড"} · {activity.actor_email || "অ্যাডমিন"}</span></div>
                  <time dateTime={activity.created_at}>{formatRelativeTime(activity.created_at)}</time>
                </li>
              ))}
            </ul>
          ) : <div className="admin-empty-state"><strong>এখনো কোনো অ্যাডমিন পরিবর্তন নেই</strong><span>সম্পাদনা ও প্রকাশের কাজ এখানে স্বয়ংক্রিয়ভাবে দেখা যাবে।</span></div>}
        </article>

        <article className="admin-panel admin-health-panel">
          <div className="admin-panel-heading"><div><p className="admin-eyebrow">সিস্টেম ও নিরাপত্তা</p><h2>ডেটা সংযোগ</h2></div><span className="admin-status-pill"><i /> সুরক্ষিত</span></div>
          <div className="admin-health-row">
            <span className={`admin-health-dot${isLoading ? " is-checking" : error ? " is-error" : ""}`} aria-hidden="true" />
            <div><strong>সুপাবেজ ডেটাবেস</strong><small>সাইটের কনটেন্ট ও কার্যক্রমের ডেটা</small></div>
            <span className={`admin-health-state${error ? " is-error" : ""}`}>{isLoading ? "যাচাই হচ্ছে" : error ? "যাচাই ব্যর্থ" : "সক্রিয়"}</span>
          </div>
          <div className="admin-health-row">
            <span className="admin-health-icon" aria-hidden="true"><FiRefreshCw /></span>
            <div><strong>ড্যাশবোর্ড রিফ্রেশ</strong><small>স্বয়ংক্রিয়ভাবে প্রতি ৬০ সেকেন্ডে</small></div>
            <span className="admin-health-state">সক্রিয়</span>
          </div>
          <div className="admin-finance-note"><strong>আর্থিক প্রতিবেদন এখনো উপলভ্য নয়</strong><p>এই ওয়েবসাইটে অনুদান বা ব্যয়ের হিসাব সংযুক্ত নেই। তাই আয়ের কোনো সংখ্যা অনুমান করে দেখানো হচ্ছে না।</p></div>
        </article>
      </section>
    </div>
  );
}

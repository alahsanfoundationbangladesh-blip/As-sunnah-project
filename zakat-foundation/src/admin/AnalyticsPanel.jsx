import useSWR from "swr";
import { FiBarChart2, FiEye, FiTrendingUp } from "react-icons/fi";
import { supabase } from "../lib/supabase";

const DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

async function getAnalytics() {
  const since = new Date(Date.now() - DAYS * DAY).toISOString();
  const [totalResult, rowsResult] = await Promise.all([
    supabase.from("site_page_views").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("site_page_views").select("path,created_at").gte("created_at", since).order("created_at", { ascending: true }).limit(5000),
  ]);
  if (totalResult.error) throw totalResult.error;
  if (rowsResult.error) throw rowsResult.error;

  const rows = rowsResult.data ?? [];
  const days = Array.from({ length: DAYS }, (_, index) => {
    const date = new Date(Date.now() - (DAYS - 1 - index) * DAY);
    date.setHours(0, 0, 0, 0);
    return { key: date.toISOString().slice(0, 10), label: new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(date), count: 0 };
  });
  const dayIndex = new Map(days.map((item, index) => [item.key, index]));
  const pageCounts = new Map();
  rows.forEach((row) => {
    const key = new Date(row.created_at).toISOString().slice(0, 10);
    const index = dayIndex.get(key);
    if (index !== undefined) days[index].count += 1;
    pageCounts.set(row.path, (pageCounts.get(row.path) ?? 0) + 1);
  });
  const maxDaily = Math.max(1, ...days.map((item) => item.count));
  const pages = [...pageCounts.entries()].map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  const total = totalResult.count ?? 0;

  return { total, days, maxDaily, pages, sampled: total > rows.length };
}

export default function AnalyticsPanel() {
  const { data, error, isLoading } = useSWR("admin-analytics", getAnalytics, { refreshInterval: 60_000, revalidateOnFocus: true });

  return (
    <section className="admin-analytics-panel">
      <div className="admin-analytics-summary admin-panel">
        <div className="admin-analytics-summary-icon"><FiEye aria-hidden="true" /></div>
        <div><p className="admin-eyebrow">LAST 30 DAYS</p><strong>{isLoading ? "—" : (data?.total ?? 0).toLocaleString()}</strong><span>Page views recorded on the public website</span></div>
        <span className="admin-live-status"><span /> Live data</span>
      </div>

      {error && <div className="admin-inline-alert" role="alert">Analytics could not be loaded. Check the analytics permission and refresh.</div>}
      <div className="admin-analytics-grid">
        <article className="admin-panel admin-chart-card">
          <div className="admin-panel-heading"><div><p className="admin-eyebrow">TRAFFIC</p><h2>Daily page views</h2></div><span className="admin-chart-period"><FiTrendingUp aria-hidden="true" /> 30 days</span></div>
          {isLoading ? <div className="admin-empty-state">Loading page-view events…</div> : (data?.total ?? 0) === 0 ? <div className="admin-empty-state"><strong>No page views recorded yet</strong><span>Counts begin when public visitors load a page after analytics is enabled.</span></div> : (
            <div className="admin-bar-chart" role="img" aria-label={`Daily website page views over the last 30 days. Total ${data.total.toLocaleString()}.`}>
              {data.days.map((day) => <div className="admin-chart-column" key={day.key} title={`${day.label}: ${day.count} views`}><div className="admin-bar-track"><span style={{ height: `${Math.max(day.count ? 4 : 0, (day.count / data.maxDaily) * 100)}%` }} /></div><small>{day.label}</small></div>)}
            </div>
          )}
          {data?.sampled && <p className="admin-chart-note">The chart shows the latest 5,000 events; the headline total includes all recorded views.</p>}
        </article>

        <article className="admin-panel admin-top-pages-card">
          <div className="admin-panel-heading"><div><p className="admin-eyebrow">CONTENT REACH</p><h2>Top pages</h2></div><FiBarChart2 aria-hidden="true" className="admin-panel-heading-icon" /></div>
          {isLoading ? <div className="admin-empty-state">Loading pages…</div> : !data?.pages.length ? <div className="admin-empty-state"><strong>Waiting for page views</strong><span>Page ranking will appear after visitors use the website.</span></div> : (
            <ol className="admin-top-pages-list">{data.pages.map((page) => <li key={page.path}><span className="admin-page-path">{page.path}</span><div className="admin-page-bar"><span style={{ width: `${(page.count / data.pages[0].count) * 100}%` }} /></div><strong>{page.count.toLocaleString()}</strong></li>)}</ol>
          )}
        </article>
      </div>
      <p className="admin-privacy-note">Analytics records page paths and timestamps only. This dashboard does not claim unique visitors, donations, or financial totals.</p>
    </section>
  );
}

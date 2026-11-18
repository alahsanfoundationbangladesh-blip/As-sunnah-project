import useSWR from "swr";
import { FiActivity, FiArrowDownRight, FiArrowUpRight, FiRefreshCw } from "react-icons/fi";
import { supabase } from "../lib/supabase";

async function getActivities() {
  const { data, error } = await supabase
    .from("admin_activity_logs")
    .select("id,action,entity_type,entity_id,actor_email,details,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

function formatTimestamp(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function ActivityPanel() {
  const { data = [], error, isLoading, mutate } = useSWR("admin-activity", getActivities, { refreshInterval: 60_000 });

  return (
    <section className="admin-activity-page">
      <div className="admin-panel admin-activity-intro"><span className="admin-settings-icon"><FiActivity aria-hidden="true" /></span><div><h2>Audited administrative changes</h2><p>Content, media, website settings and team-access changes are recorded by database triggers.</p></div><button className="admin-secondary-button" onClick={() => mutate()}><FiRefreshCw aria-hidden="true" /> Refresh</button></div>
      {error && <div className="admin-inline-alert" role="alert">Activity records could not be loaded. Check dashboard access and refresh.</div>}
      <div className="admin-panel admin-table-panel">
        <div className="admin-table-heading"><div><h2>Latest events</h2><p>Showing the latest 100 database audit records.</p></div><span className="admin-record-count">{data.length} events</span></div>
        {isLoading ? <div className="admin-empty-state">Loading audit records…</div> : data.length ? (
          <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Action</th><th>Record</th><th>Administrator</th><th>Date and time</th></tr></thead><tbody>{data.map((event) => <tr key={event.id}><td><span className={`admin-action-badge ${event.action}`}>{event.action === "delete" ? <FiArrowDownRight /> : <FiArrowUpRight />}{event.action}</span></td><td><div className="admin-content-title-cell"><div><strong>{event.details?.label || "Untitled record"}</strong><small>{event.entity_type.replaceAll("_", " ")}</small></div></div></td><td className="admin-muted-cell">{event.actor_email || "System"}</td><td className="admin-muted-cell">{formatTimestamp(event.created_at)}</td></tr>)}</tbody></table></div>
        ) : <div className="admin-empty-state"><strong>No changes recorded yet</strong><span>New administration actions appear here automatically.</span></div>}
      </div>
    </section>
  );
}

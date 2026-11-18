import { useMemo, useState } from "react";
import useSWR from "swr";
import { FiChevronLeft, FiChevronRight, FiRefreshCw, FiSearch, FiShield, FiUserCheck, FiUserX } from "react-icons/fi";
import { supabase } from "../lib/supabase";

const pageKey = (page) => ["admin-user-directory", page];

async function getUsers([, page]) {
  const { data, error } = await supabase.functions.invoke("admin-users", {
    body: { action: "list", page },
  });
  if (error || !data?.users) throw error ?? new Error("Account directory unavailable.");
  return data;
}

function formatDate(value) {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function titleCase(value) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusLabel(status) {
  if (status === "pending") return "Email not confirmed";
  if (status === "suspended") return "Suspended";
  return "Active";
}

export default function UserManagementPanel({ isRoot, rootChecked, onNotice }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busyUserId, setBusyUserId] = useState("");
  const key = useMemo(() => pageKey(page), [page]);
  const { data, error, isLoading, mutate } = useSWR(rootChecked && isRoot ? key : null, getUsers, {
    refreshInterval: 60_000,
    revalidateOnFocus: true,
  });

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return (data?.users ?? []).filter((user) => {
      const matchesSearch = !normalizedSearch || [user.displayName, user.email, user.id]
        .some((value) => value?.toLowerCase().includes(normalizedSearch));
      return matchesSearch && (statusFilter === "all" || user.status === statusFilter);
    });
  }, [data?.users, search, statusFilter]);

  const updateAccountStatus = async (user) => {
    if (!isRoot || busyUserId) return;
    const action = user.status === "suspended" ? "reactivate" : "suspend";
    const confirmation = action === "suspend"
      ? `Suspend ${user.email || "this account"}? They will no longer be able to sign in or refresh their session.`
      : `Reactivate ${user.email || "this account"}?`;
    if (!window.confirm(confirmation)) return;

    setBusyUserId(user.id);
    const { data: result, error: actionError } = await supabase.functions.invoke("admin-users", {
      body: { action, userId: user.id },
    });
    setBusyUserId("");

    if (actionError || !result?.success) {
      onNotice("The account status could not be changed. Confirm the account service is available and try again.");
      return;
    }

    await mutate();
    onNotice(result.auditRecorded
      ? action === "suspend" ? "Account suspended and the change was recorded." : "Account reactivated and the change was recorded."
      : "Account status changed, but the audit entry could not be saved.");
  };

  if (!rootChecked) return <div className="admin-panel admin-empty-state">Checking Super Admin account-management access…</div>;
  if (!isRoot) return <div className="admin-inline-alert" role="alert">Only the designated Super Admin can manage registered accounts.</div>;

  return (
    <section className="admin-user-directory">
      <div className="admin-panel admin-user-intro">
        <span className="admin-settings-icon"><FiShield aria-hidden="true" /></span>
        <div><h2>Registered account directory</h2><p>Accounts are read from Supabase Auth. Profile names appear only when users have supplied them. Admin roles and permissions are managed in Admin team.</p></div>
        <span className="admin-status-pill status-published">Super Admin only</span>
      </div>

      <div className="admin-user-toolbar">
        <label className="admin-search-box"><FiSearch aria-hidden="true" /><span className="sr-only">Search this page of accounts</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search this page by name, email or ID" /></label>
        <label className="admin-user-filter"><span className="sr-only">Filter accounts by status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All account states</option><option value="active">Active</option><option value="pending">Email not confirmed</option><option value="suspended">Suspended</option></select></label>
        <button className="admin-secondary-button" type="button" onClick={() => mutate()} disabled={isLoading}><FiRefreshCw aria-hidden="true" /> Refresh</button>
      </div>

      {error && <div className="admin-inline-alert" role="alert">The account directory could not be loaded. Check the secure Supabase account service and refresh.</div>}

      <div className="admin-panel admin-table-panel">
        <div className="admin-table-heading"><div><h2>Accounts</h2><p>Page {page} · {data?.users?.length ?? 0} accounts loaded. Search and status filters apply to this page.</p></div><span className="admin-record-count">{filteredUsers.length} shown</span></div>
        {isLoading ? <div className="admin-empty-state">Loading registered accounts…</div> : filteredUsers.length ? (
          <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Profile</th><th>Role and permissions</th><th>Account state</th><th>Last sign-in</th><th>Created</th><th>Actions</th></tr></thead><tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td><div className="admin-member-cell"><span className={`admin-avatar${user.status === "suspended" ? " suspended" : ""}`}>{(user.displayName?.[0] || user.email?.[0] || "U").toUpperCase()}</span><div><strong>{user.displayName || user.email || "Unnamed account"}</strong><small>{user.email || "No email address"}</small></div></div></td>
                <td><div className="admin-user-role"><strong>{titleCase(user.role || "member")}</strong><small>{user.adminAccessStatus === "none" ? "Standard account" : `${titleCase(user.adminAccessStatus)} · ${(user.permissions ?? []).length} permission${(user.permissions ?? []).length === 1 ? "" : "s"}`}</small></div></td>
                <td><span className={`admin-status-pill status-${user.status === "active" ? "published" : user.status === "suspended" ? "archived" : "scheduled"}`}>{statusLabel(user.status)}</span></td>
                <td className="admin-muted-cell">{formatDate(user.lastSignInAt)}</td>
                <td className="admin-muted-cell">{formatDate(user.createdAt)}</td>
                <td><button className={`admin-small-action ${user.status === "suspended" ? "publish" : "danger"} admin-user-action`} type="button" onClick={() => updateAccountStatus(user)} disabled={busyUserId === user.id || Boolean(busyUserId)} aria-label={`${user.status === "suspended" ? "Reactivate" : "Suspend"} ${user.email || "account"}`}>
                  {busyUserId === user.id ? "Updating…" : user.status === "suspended" ? <><FiUserCheck aria-hidden="true" /> Reactivate</> : <><FiUserX aria-hidden="true" /> Suspend</>}
                </button></td>
              </tr>
            ))}
          </tbody></table></div>
        ) : <div className="admin-empty-state"><strong>{data?.users?.length ? "No accounts match these filters" : "No registered accounts found"}</strong><span>Try a different search or account state.</span></div>}
        <div className="admin-user-pagination"><button className="admin-secondary-button" type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1 || isLoading}><FiChevronLeft aria-hidden="true" /> Previous</button><span>Page {page}</span><button className="admin-secondary-button" type="button" onClick={() => setPage((current) => current + 1)} disabled={!data?.hasMore || isLoading}>Next <FiChevronRight aria-hidden="true" /></button></div>
      </div>
    </section>
  );
}

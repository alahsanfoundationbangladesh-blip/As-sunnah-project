import { useState } from "react";
import useSWR, { mutate } from "swr";
import { FiShield, FiUserPlus, FiUsers } from "react-icons/fi";
import { supabase } from "../lib/supabase";

const permissionOptions = [
  ["dashboard.view", "View dashboard"],
  ["content.manage", "Manage pages, articles and news"],
  ["video.manage", "Manage videos"],
  ["media.manage", "Manage media library"],
  ["settings.manage", "Change website settings"],
  ["analytics.view", "View analytics"],
  ["team.manage", "Manage administrator invitations"],
];

async function getAdminTeam() {
  const { data, error } = await supabase.from("admin_memberships").select("id,email,role,permissions,status,created_at,updated_at").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

function displayDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function TeamPanel({ user, isRoot, rootChecked, onNotice }) {
  const { data = [], error, isLoading } = useSWR("admin-team", getAdminTeam);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [permissions, setPermissions] = useState(["dashboard.view", "content.manage"]);
  const [busy, setBusy] = useState(false);

  const togglePermission = (permission) => {
    setPermissions((current) => current.includes(permission)
      ? current.filter((item) => item !== permission)
      : [...current, permission]);
  };

  const inviteMember = async (event) => {
    event.preventDefault();
    if (!isRoot) {
      onNotice("Only the designated Super Admin can change team access.");
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || normalizedEmail === user.email?.toLowerCase()) {
      onNotice("Enter a different administrator email address.");
      return;
    }

    setBusy(true);
    const { error: inviteError } = await supabase.from("admin_memberships").upsert({
      email: normalizedEmail,
      role,
      permissions: role === "administrator" ? ["all"] : Array.from(new Set(["dashboard.view", ...permissions])),
      status: "active",
      invited_by: user.id,
    }, { onConflict: "email" });
    setBusy(false);

    if (inviteError) {
      onNotice(inviteError.code === "23505" ? "An invitation for this email already exists." : "The invitation could not be saved. Check your access and try again.");
      return;
    }

    await mutate("admin-team");
    setEmail("");
    onNotice("Access is ready. The invitee must create an account and confirm this exact email address before signing in.");
  };

  const changeStatus = async (member, status) => {
    if (!isRoot) return;
    const { error: updateError } = await supabase.from("admin_memberships").update({ status }).eq("id", member.id);
    if (updateError) {
      onNotice("Team access could not be updated.");
      return;
    }
    await mutate("admin-team");
    onNotice(status === "suspended" ? "Administrator access suspended." : "Administrator access restored.");
  };

  const removeMember = async (member) => {
    if (!isRoot || !window.confirm(`Remove dashboard access for ${member.email}?`)) return;
    const { error: removeError } = await supabase.from("admin_memberships").delete().eq("id", member.id);
    if (removeError) {
      onNotice("Administrator access could not be removed.");
      return;
    }
    await mutate("admin-team");
    onNotice("Administrator access removed.");
  };

  return (
    <section className="admin-team-panel">
      {!rootChecked && <div className="admin-panel admin-empty-state">Checking team-management permissions…</div>}
      {rootChecked && isRoot && (
        <form className="admin-panel admin-invite-form" onSubmit={inviteMember}>
          <div className="admin-panel-heading"><div><p className="admin-eyebrow">CONTROLLED ACCESS</p><h2>Invite a team member</h2></div><span className="admin-settings-icon"><FiUserPlus aria-hidden="true" /></span></div>
          <p className="admin-panel-description">Grant access to an email address. The invitee must register with that address and verify it before database permissions take effect.</p>
          <div className="admin-invite-fields"><label className="admin-field"><span>Team member email</span><input type="email" autoComplete="off" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="colleague@example.com" required /></label><label className="admin-field"><span>Role</span><select value={role} onChange={(event) => setRole(event.target.value)}><option value="editor">Editor</option><option value="moderator">Moderator</option><option value="analyst">Analyst</option><option value="administrator">Administrator · full access</option></select></label></div>
          {role !== "administrator" && <fieldset className="admin-permissions-fieldset"><legend>Permissions</legend><div>{permissionOptions.map(([permission, label]) => <label key={permission}><input type="checkbox" checked={permissions.includes(permission)} onChange={() => togglePermission(permission)} />{label}</label>)}</div></fieldset>}
          <div className="admin-invite-footer"><span><FiShield aria-hidden="true" /> Email confirmation and RLS are enforced.</span><button className="admin-primary-button" type="submit" disabled={busy}>{busy ? "Saving…" : "Grant dashboard access"}</button></div>
        </form>
      )}

      {error && <div className="admin-inline-alert" role="alert">Admin team records could not be loaded. Check team permissions and refresh.</div>}
      <div className="admin-panel admin-table-panel">
        <div className="admin-table-heading"><div><h2>Administrator access</h2><p>Only confirmed accounts with an active membership can access protected records.</p></div><span className="admin-record-count"><FiUsers aria-hidden="true" /> {data.length + 1} accounts</span></div>
        {isLoading ? <div className="admin-empty-state">Loading team permissions…</div> : (
          <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Account</th><th>Role</th><th>Access status</th><th>Invited / updated</th><th>Actions</th></tr></thead><tbody>
            <tr className="admin-root-row"><td><div className="admin-member-cell"><span className="admin-avatar root">{(user.email?.[0] ?? "A").toUpperCase()}</span><div><strong>{user.email}</strong><small>Designated Super Admin</small></div></div></td><td><span className="admin-type-pill">Super Admin</span></td><td><span className="admin-status-pill status-published">Protected</span></td><td className="admin-muted-cell">Primary account</td><td><span className="admin-muted-cell">Always authorized</span></td></tr>
            {data.map((member) => <tr key={member.id}><td><div className="admin-member-cell"><span className="admin-avatar">{member.email[0].toUpperCase()}</span><div><strong>{member.email}</strong><small>{member.permissions.length} assigned permission{member.permissions.length === 1 ? "" : "s"}</small></div></div></td><td><span className="admin-type-pill">{member.role}</span></td><td><span className={`admin-status-pill status-${member.status === "active" ? "published" : member.status === "suspended" ? "archived" : "scheduled"}`}>{member.status === "active" ? "Access ready" : member.status}</span></td><td className="admin-muted-cell">{displayDate(member.updated_at || member.created_at)}</td><td><div className="admin-row-actions">{isRoot && <><button className="admin-small-action" onClick={() => changeStatus(member, member.status === "suspended" ? "active" : "suspended")}>{member.status === "suspended" ? "Restore" : "Suspend"}</button><button className="admin-small-action danger" onClick={() => removeMember(member)}>Remove</button></>}</div></td></tr>)}
          </tbody></table></div>
        )}
        {!isLoading && data.length === 0 && <div className="admin-empty-state"><strong>No team members invited</strong><span>Invite trusted staff and assign only the permissions they need.</span></div>}
      </div>
    </section>
  );
}

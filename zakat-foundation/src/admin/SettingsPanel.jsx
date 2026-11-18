import useSWR, { mutate } from "swr";
import { useEffect, useState } from "react";
import { FiCheck, FiGlobe, FiImage, FiRotateCw } from "react-icons/fi";
import { PUBLIC_SETTINGS_KEY } from "../lib/site-settings";
import { supabase } from "../lib/supabase";

async function getSettings() {
  const { data, error } = await supabase.from("site_settings").select("key,value,is_public,updated_at");
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((item) => [item.key, item]));
}

function settingValue(item, fallback = "") {
  return item?.value == null ? fallback : String(item.value);
}

export default function SettingsPanel({ user, canManage, accessChecked, onNotice }) {
  const { data, error, isLoading } = useSWR("admin-site-settings", getSettings);
  const [form, setForm] = useState({ site_name: "", brand_color: "#368547", logo_url: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data) return;
    setForm({
      site_name: settingValue(data.site_name, "As-Sunnah Foundation"),
      brand_color: settingValue(data.brand_color, "#368547"),
      logo_url: settingValue(data.logo_url, "/images/logo.png"),
    });
  }, [data]);

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaved(false);
    if (!canManage) {
      onNotice("Your account does not have permission to change website settings.");
      return;
    }
    if (!/^#[\da-fA-F]{6}$/.test(form.brand_color)) {
      onNotice("Enter a valid six-digit hex color.");
      return;
    }
    if (form.logo_url && !form.logo_url.startsWith("/") && !/^https:\/\//i.test(form.logo_url)) {
      onNotice("Use a site-relative logo path or a secure HTTPS URL.");
      return;
    }

    setSaving(true);
    const updates = Object.entries(form).map(([key, value]) => ({
      key,
      value,
      is_public: true,
      updated_by: user.id,
    }));
    const { error: saveError } = await supabase.from("site_settings").upsert(updates, { onConflict: "key" });

    if (saveError) {
      setSaving(false);
      onNotice("Settings could not be saved. Check your settings permission and try again.");
      return;
    }

    await Promise.all([
      mutate("admin-site-settings"),
      mutate(PUBLIC_SETTINGS_KEY),
    ]);
    setSaving(false);
    setSaved(true);
    onNotice("Website name, logo and brand color saved.");
  };

  if (error) return <div className="admin-inline-alert" role="alert">Website settings could not be loaded. Check the connection and refresh.</div>;

  return (
    <section className="admin-settings-panel">
      <div className="admin-settings-intro admin-panel">
        <span className="admin-settings-icon"><FiGlobe aria-hidden="true" /></span>
        <div><h2>Public website identity</h2><p>These values are read by the public site. Changes are applied after the settings save.</p></div>
        <span className="admin-status-pill status-published">Public</span>
      </div>

      {accessChecked && !canManage && <div className="admin-inline-alert" role="alert">Your role can view settings but cannot change them.</div>}
      {isLoading ? <div className="admin-panel admin-empty-state">Loading current website settings…</div> : (
        <form className="admin-panel admin-settings-form" onSubmit={saveSettings}>
          <div className="admin-settings-section-heading"><div><p className="admin-eyebrow">BRAND</p><h3>Website identity</h3></div>{saved && <span className="admin-saved-indicator"><FiCheck aria-hidden="true" /> Saved</span>}</div>
          <label className="admin-field"><span>Website name</span><input value={form.site_name} onChange={(event) => setForm((current) => ({ ...current, site_name: event.target.value }))} maxLength={100} required disabled={!canManage} /></label>
          <div className="admin-settings-grid">
            <label className="admin-field"><span>Primary brand color</span><div className="admin-color-input"><input type="color" value={/^#[\da-fA-F]{6}$/.test(form.brand_color) ? form.brand_color : "#368547"} onChange={(event) => setForm((current) => ({ ...current, brand_color: event.target.value }))} aria-label="Choose primary brand color" disabled={!canManage} /><input value={form.brand_color} onChange={(event) => setForm((current) => ({ ...current, brand_color: event.target.value }))} maxLength={7} aria-label="Brand color hex value" disabled={!canManage} /></div><small>Applied across shared website brand styles.</small></label>
            <label className="admin-field"><span>Logo image URL</span><div className="admin-settings-input-icon"><FiImage aria-hidden="true" /><input value={form.logo_url} onChange={(event) => setForm((current) => ({ ...current, logo_url: event.target.value }))} placeholder="/images/logo.png" disabled={!canManage} /></div><small>Use a site-relative path or HTTPS URL.</small></label>
          </div>
          {form.logo_url && <div className="admin-logo-preview"><img src={form.logo_url} alt="Website logo preview" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} /><span>Logo preview</span></div>}
          <div className="admin-settings-actions"><button className="admin-secondary-button" type="button" disabled={!canManage || isLoading} onClick={() => { if (data) setForm({ site_name: settingValue(data.site_name, "As-Sunnah Foundation"), brand_color: settingValue(data.brand_color, "#368547"), logo_url: settingValue(data.logo_url, "/images/logo.png") }); }}><FiRotateCw aria-hidden="true" /> Reset changes</button><button className="admin-primary-button" type="submit" disabled={!canManage || saving || isLoading}>{saving ? "Saving…" : "Save website settings"}</button></div>
        </form>
      )}
    </section>
  );
}

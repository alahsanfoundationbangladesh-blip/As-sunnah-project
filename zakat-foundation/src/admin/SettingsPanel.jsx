import useSWR, { mutate } from "swr";
import { useEffect, useState } from "react";
import { FiCheck, FiGlobe, FiImage, FiRotateCw } from "react-icons/fi";
import { PUBLIC_SETTINGS_KEY } from "../lib/site-settings";
import HomepageSettingsFields from "./HomepageSettingsFields";
import { supabase } from "../lib/supabase";

const DEFAULT_SETTINGS = {
  site_name: "আল আহসান ফাউন্ডেশন বাংলাদেশ",
  brand_color: "#145b46",
  logo_url: "",
  home_eyebrow: "সেবা · শিক্ষা · মানবিকতা",
  home_heading: "মানবিকতার পাশে, মানুষের কল্যাণে",
  home_description: "শিক্ষা, দক্ষতা উন্নয়ন ও মানবিক সহায়তার মাধ্যমে মানুষের পাশে দাঁড়াতে আমাদের সঙ্গে যুক্ত হোন। আপনার সহায়তা পৌঁছে যাক প্রয়োজনের সময়ে, প্রয়োজনীয় মানুষের কাছে।",
  home_hero_image_url: "/images/header.png",
  home_hero_image_alt: "দক্ষতা উন্নয়ন প্রশিক্ষণে অংশগ্রহণকারীরা",
  home_image_caption: "মানুষের পাশে, কল্যাণের পথে",
  home_primary_cta_label: "দান করুন",
  home_secondary_cta_label: "আমাদের কার্যক্রম",
  home_activities_eyebrow: "আমাদের উদ্যোগ",
  home_activities_heading: "যেখানে সহায়তা পৌঁছায়, সেখানেই পরিবর্তনের শুরু",
  home_activities_description: "প্রতিটি উদ্যোগের লক্ষ্য মানুষের মর্যাদা, সক্ষমতা ও কল্যাণকে এগিয়ে নেওয়া।",
  home_activity_donate_label: "এই উদ্যোগে সহায়তা করুন",
  home_activity_1_title: "দক্ষতা উন্নয়ন ও কর্মসংস্থান",
  home_activity_1_description: "আত্মনির্ভরতার পথে এগিয়ে যেতে প্রয়োজনীয় দক্ষতা শেখা ও কাজের সুযোগ তৈরিতে পাশে থাকুন।",
  home_activity_1_image_url: "/images/header.png",
  home_activity_1_image_alt: "দক্ষতা উন্নয়ন প্রশিক্ষণে অংশগ্রহণকারীরা",
  home_activity_2_title: "শিক্ষা ও প্রশিক্ষণ সহায়তা",
  home_activity_2_description: "শিক্ষা ও প্রশিক্ষণের সুযোগ আরও মানুষের কাছে পৌঁছে দিতে আপনার সহায়তা যুক্ত করুন।",
  home_activity_2_image_url: "/images/ongoing/ima2.png",
  home_activity_2_image_alt: "শিক্ষা ও প্রশিক্ষণের পরিবেশ",
  home_activity_3_title: "পরিবেশ সংরক্ষণ ও বৃক্ষরোপণ",
  home_activity_3_description: "সবুজ ও বাসযোগ্য পরিবেশ গড়ার উদ্যোগে অংশ নিন, ভবিষ্যৎ প্রজন্মের জন্য।",
  home_activity_3_image_url: "/images/ongoing/ima3.png",
  home_activity_3_image_alt: "বৃক্ষরোপণ কার্যক্রম",
  home_closing_title: "আপনার সহায়তায় এগিয়ে যাবে মানুষের কল্যাণ",
  home_closing_description: "একটি আন্তরিক সহায়তাও কারও জীবনে আশার আলো হয়ে উঠতে পারে। আজই আমাদের সঙ্গে যুক্ত হোন।",
  home_closing_cta_label: "সহায়তার হাত বাড়ান",
  footer_description: "শিক্ষা, দক্ষতা উন্নয়ন ও মানবিক সহায়তায় মানুষের পাশে।",
};

function getFormValues(data) {
  return Object.fromEntries(Object.entries(DEFAULT_SETTINGS).map(([key, fallback]) => [key, settingValue(data?.[key], fallback)]));
}

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
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data) return;
    setForm(getFormValues(data));
  }, [data]);

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaved(false);
    if (!canManage) {
      onNotice("ওয়েবসাইটের সেটিংস পরিবর্তনের অনুমতি আপনার অ্যাকাউন্টে নেই।");
      return;
    }
    if (!/^#[\da-fA-F]{6}$/.test(form.brand_color)) {
      onNotice("ছয় অক্ষরের সঠিক হেক্স রং লিখুন।");
      return;
    }
    const invalidImage = Object.entries(form).find(([key, value]) => key.endsWith("_url") && value && !value.startsWith("/") && !/^https:\/\//i.test(value));
    if (invalidImage) {
      onNotice("ছবির জন্য সাইটের ভেতরের পথ অথবা নিরাপদ HTTPS ঠিকানা ব্যবহার করুন।");
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
      onNotice("সেটিংস সংরক্ষণ করা যায়নি। অনুমতি যাচাই করে আবার চেষ্টা করুন।");
      return;
    }

    await Promise.all([
      mutate("admin-site-settings"),
      mutate(PUBLIC_SETTINGS_KEY),
    ]);
    setSaving(false);
    setSaved(true);
    onNotice("ওয়েবসাইটের পরিচিতি, হোমপেজের লেখা ও ছবি সংরক্ষিত হয়েছে।");
  };

  if (error) return <div className="admin-inline-alert" role="alert">ওয়েবসাইটের সেটিংস লোড করা যায়নি। সংযোগ যাচাই করে আবার চেষ্টা করুন।</div>;

  return (
    <section className="admin-settings-panel">
      <div className="admin-settings-intro admin-panel">
        <span className="admin-settings-icon"><FiGlobe aria-hidden="true" /></span>
        <div><h2>ওয়েবসাইটের পরিচিতি ও হোমপেজ</h2><p>এখানে নাম, রং, লেখা ও ছবি বদলালে পাবলিক ওয়েবসাইটে তা দেখা যাবে।</p></div>
        <span className="admin-status-pill status-published">সর্বসাধারণের জন্য</span>
      </div>

      {accessChecked && !canManage && <div className="admin-inline-alert" role="alert">আপনার ভূমিকা সেটিংস দেখার অনুমতি দেয়, পরিবর্তনের নয়।</div>}
      {isLoading ? <div className="admin-panel admin-empty-state">বর্তমান ওয়েবসাইট সেটিংস লোড হচ্ছে…</div> : (
        <form className="admin-panel admin-settings-form" onSubmit={saveSettings}>
          <div className="admin-settings-section-heading"><div><p className="admin-eyebrow">পরিচিতি</p><h3>ওয়েবসাইটের নাম ও রং</h3></div>{saved && <span className="admin-saved-indicator"><FiCheck aria-hidden="true" /> সংরক্ষিত</span>}</div>
          <label className="admin-field"><span>ওয়েবসাইটের নাম</span><input value={form.site_name} onChange={(event) => setForm((current) => ({ ...current, site_name: event.target.value }))} maxLength={100} required disabled={!canManage} /></label>
          <div className="admin-settings-grid">
            <label className="admin-field"><span>প্রধান ব্র্যান্ড রং</span><div className="admin-color-input"><input type="color" value={/^#[\da-fA-F]{6}$/.test(form.brand_color) ? form.brand_color : "#145b46"} onChange={(event) => setForm((current) => ({ ...current, brand_color: event.target.value }))} aria-label="প্রধান ব্র্যান্ড রং বেছে নিন" disabled={!canManage} /><input value={form.brand_color} onChange={(event) => setForm((current) => ({ ...current, brand_color: event.target.value }))} maxLength={7} aria-label="হেক্স রং কোড" disabled={!canManage} /></div><small>সাইটের বিভিন্ন অংশে এই রং ব্যবহার হবে।</small></label>
            <label className="admin-field"><span>লোগোর ছবির URL</span><div className="admin-settings-input-icon"><FiImage aria-hidden="true" /><input value={form.logo_url} onChange={(event) => setForm((current) => ({ ...current, logo_url: event.target.value }))} placeholder="/images/logo.png" disabled={!canManage} /></div><small>মিডিয়া লাইব্রেরির URL অথবা সাইটের ভেতরের ছবির পথ দিন।</small></label>
          </div>
          {form.logo_url && <div className="admin-logo-preview"><img src={form.logo_url} alt="ওয়েবসাইটের লোগোর প্রিভিউ" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} /><span>লোগোর প্রিভিউ</span></div>}
          <HomepageSettingsFields form={form} setForm={setForm} canManage={canManage} />
          <div className="admin-settings-actions"><button className="admin-secondary-button" type="button" disabled={!canManage || isLoading} onClick={() => { if (data) setForm(getFormValues(data)); }}><FiRotateCw aria-hidden="true" /> পরিবর্তন বাতিল করুন</button><button className="admin-primary-button" type="submit" disabled={!canManage || saving || isLoading}>{saving ? "সংরক্ষণ হচ্ছে…" : "সব সেটিংস সংরক্ষণ করুন"}</button></div>
        </form>
      )}
    </section>
  );
}

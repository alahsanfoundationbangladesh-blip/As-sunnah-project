import { useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import { FiEdit2, FiPlus, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import { CONTENT_FIELDS } from "../lib/site-content";
import { supabase } from "../lib/supabase";

const contentTypes = ["page", "article", "news", "video"];
const statuses = ["draft", "published", "scheduled", "archived"];
const contentTypeLabels = { page: "পাতা", article: "প্রবন্ধ", news: "সংবাদ", video: "ভিডিও" };
const statusLabels = { draft: "খসড়া", published: "প্রকাশিত", scheduled: "নির্ধারিত", archived: "সংরক্ষিত" };
const emptyForm = {
  id: "",
  content_type: "article",
  title: "",
  slug: "",
  summary: "",
  body: "",
  image_url: "",
  video_url: "",
  category: "",
  tags: "",
  status: "draft",
  is_featured: false,
  is_breaking: false,
  scheduled_at: "",
  seo_title: "",
  seo_description: "",
  seo_keywords: "",
  playlist: "",
};

function slugify(value) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatDate(value) {
  if (!value) return "নির্ধারিত নয়";
  return new Intl.DateTimeFormat("bn-BD", { dateStyle: "medium" }).format(new Date(value));
}

async function fetchContent(filterType) {
  let query = supabase.from("site_content").select(CONTENT_FIELDS).order("updated_at", { ascending: false }).limit(200);
  if (filterType === "article") query = query.in("content_type", ["article", "page"]);
  else if (filterType) query = query.eq("content_type", filterType);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

function Field({ label, hint, children, className = "" }) {
  return <label className={`admin-field ${className}`}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export default function ContentManager({ filterType, onNotice, user }) {
  const cacheKey = ["admin-content", filterType];
  const { data = [], error, isLoading } = useSWR(cacheKey, () => fetchContent(filterType));
  const [query, setQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return data;
    return data.filter((row) => `${row.title} ${row.slug} ${row.category} ${row.status}`.toLowerCase().includes(normalized));
  }, [data, query]);

  const startCreate = () => {
    setForm({ ...emptyForm, content_type: filterType === "article" ? "article" : filterType || "article" });
    setFormError("");
    setEditorOpen(true);
  };

  const startEdit = (row) => {
    setForm({
      ...emptyForm,
      ...row,
      tags: (row.tags ?? []).join(", "),
      seo_keywords: (row.seo_keywords ?? []).join(", "),
      scheduled_at: row.scheduled_at ? new Date(row.scheduled_at).toISOString().slice(0, 16) : "",
      playlist: row.metadata?.playlist ?? "",
    });
    setFormError("");
    setEditorOpen(true);
  };

  const change = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const saveContent = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    const slug = slugify(form.slug || form.title);
    if (!slug) {
      setFormError("পাবলিক লিংকের জন্য একটি URL slug লিখুন। শিরোনাম বাংলায় রাখা যাবে।");
      setSaving(false);
      return;
    }
    if (form.content_type === "video" && !form.video_url.trim()) {
      setFormError("সংরক্ষণের আগে YouTube, Vimeo অথবা সরাসরি ভিডিওর লিংক দিন।");
      setSaving(false);
      return;
    }
    if (form.status === "scheduled" && !form.scheduled_at) {
      setFormError("নির্ধারিত কনটেন্টের জন্য প্রকাশের তারিখ ও সময় বেছে নিন।");
      setSaving(false);
      return;
    }

    const payload = {
      content_type: form.content_type,
      title: form.title.trim(),
      slug,
      summary: form.summary.trim(),
      body: form.body,
      image_url: form.image_url.trim() || null,
      video_url: form.content_type === "video" ? form.video_url.trim() : null,
      category: form.category.trim(),
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      status: form.status,
      is_featured: form.is_featured,
      is_breaking: form.content_type === "news" && form.is_breaking,
      scheduled_at: form.status === "scheduled" ? new Date(form.scheduled_at).toISOString() : null,
      published_at: form.status === "published" ? (form.published_at || new Date().toISOString()) : null,
      seo_title: form.seo_title.trim(),
      seo_description: form.seo_description.trim(),
      seo_keywords: form.seo_keywords.split(",").map((keyword) => keyword.trim()).filter(Boolean),
      og_image_url: form.image_url.trim() || null,
      metadata: { ...(form.metadata ?? {}), playlist: form.playlist.trim() },
    };

    const request = form.id
      ? supabase.from("site_content").update(payload).eq("id", form.id)
      : supabase.from("site_content").insert({ ...payload, created_by: user.id });
    const { error: saveError } = await request;

    if (saveError) {
      setFormError(saveError.code === "23505" ? "এই URL slug-টি ব্যবহৃত হচ্ছে। অন্য একটি slug দিন।" : "ডেটাবেসে এই কনটেন্ট সংরক্ষণ করা যায়নি। অনুমতি যাচাই করে আবার চেষ্টা করুন।");
      setSaving(false);
      return;
    }

    await Promise.all([
      mutate(cacheKey),
      mutate(["admin-overview"]),
      mutate("admin-activity"),
    ]);
    await mutate((key) => Array.isArray(key) && ["public-site-content", "public-content-detail", "public-news-detail"].includes(key[0]));
    setSaving(false);
    setEditorOpen(false);
    onNotice(form.id ? "কনটেন্ট হালনাগাদ করে ওয়েবসাইটে সংরক্ষণ করা হয়েছে।" : "নতুন কনটেন্ট ওয়েবসাইটের ডেটাবেসে তৈরি হয়েছে।");
  };

  const updateStatus = async (item, status) => {
    const update = {
      status,
      scheduled_at: null,
      published_at: status === "published" ? (item.published_at || new Date().toISOString()) : null,
    };
    const { error: updateError } = await supabase.from("site_content").update(update).eq("id", item.id);
    if (updateError) {
      onNotice("অবস্থার পরিবর্তন অনুমোদিত হয়নি বা সংরক্ষণ করা যায়নি।");
      return;
    }
    await mutate(cacheKey);
    await mutate(["admin-overview"]);
    await mutate((key) => Array.isArray(key) && ["public-site-content", "public-content-detail", "public-news-detail"].includes(key[0]));
    onNotice(status === "published" ? "কনটেন্ট প্রকাশিত হয়েছে এবং এখন ওয়েবসাইটে দেখা যাবে।" : "কনটেন্ট অপ্রকাশিত করা হয়েছে। এটি আর ওয়েবসাইটে দেখা যাবে না।");
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`“${item.title}” স্থায়ীভাবে মুছে ফেলবেন? এই কাজটি ফিরিয়ে নেওয়া যাবে না.`)) return;
    const { error: deleteError } = await supabase.from("site_content").delete().eq("id", item.id);
    if (deleteError) {
      onNotice("এই কনটেন্ট মুছে ফেলা যায়নি। অনুমতি যাচাই করে আবার চেষ্টা করুন।");
      return;
    }
    await mutate(cacheKey);
    await mutate(["admin-overview"]);
    await mutate((key) => Array.isArray(key) && ["public-site-content", "public-content-detail", "public-news-detail"].includes(key[0]));
    onNotice("ওয়েবসাইটের ডেটাবেস থেকে কনটেন্ট মুছে ফেলা হয়েছে।");
  };

  const heading = filterType === "news" ? "সংবাদ" : filterType === "video" ? "ভিডিও" : "পাতা ও প্রবন্ধ";

  return (
    <section className="admin-content-manager">
      <div className="admin-toolbar">
        <div className="admin-search-box"><FiSearch aria-hidden="true" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} aria-label={`${heading} খুঁজুন`} placeholder={`${heading} খুঁজুন…`} /></div>
        <button className="admin-primary-button" onClick={startCreate}><FiPlus aria-hidden="true" /> নতুন {filterType === "news" ? "সংবাদ" : filterType === "video" ? "ভিডিও" : "কনটেন্ট"}</button>
      </div>

      <div className="admin-panel admin-table-panel">
        <div className="admin-table-heading"><div><h2>{heading}</h2><p>পরিবর্তন সরাসরি ওয়েবসাইটের ডেটাবেসে সংরক্ষিত হয়।</p></div><span className="admin-record-count">{new Intl.NumberFormat("bn-BD").format(data.length)}টি</span></div>
        {error && <div className="admin-inline-alert" role="alert">কনটেন্ট লোড করা যায়নি। সাইন-ইন করা অ্যাকাউন্টের অনুমতি যাচাই করে রিফ্রেশ করুন।</div>}
        {isLoading ? <div className="admin-empty-state">ডেটাবেসের কনটেন্ট লোড হচ্ছে…</div> : filteredRows.length === 0 ? (
          <div className="admin-empty-state"><strong>{query ? "কোনো কনটেন্ট মেলেনি" : "এই বিভাগে এখনো কনটেন্ট নেই"}</strong><span>ওয়েবসাইটে প্রকাশের জন্য একটি কনটেন্ট তৈরি করুন।</span></div>
        ) : (
          <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>শিরোনাম</th><th>ধরন</th><th>অবস্থা</th><th>সর্বশেষ পরিবর্তন</th><th><span className="sr-only">কাজ</span></th></tr></thead>
            <tbody>{filteredRows.map((item) => (
              <tr key={item.id}>
                <td><div className="admin-content-title-cell">{item.image_url && <img src={item.image_url} alt="" />}<div><strong>{item.title}</strong><small>/{item.slug}</small></div></div></td>
                <td><span className="admin-type-pill">{contentTypeLabels[item.content_type] ?? "কনটেন্ট"}</span>{item.is_breaking && <span className="admin-breaking-pill">জরুরি সংবাদ</span>}</td>
                <td><span className={`admin-status-pill status-${item.status}`}>{statusLabels[item.status] ?? "অজানা"}</span>{item.status === "scheduled" && <small className="admin-table-subtext">{formatDate(item.scheduled_at)}</small>}</td>
                <td className="admin-muted-cell">{formatDate(item.updated_at)}</td>
                <td><div className="admin-row-actions">
                  {item.status !== "published" && <button className="admin-small-action publish" onClick={() => updateStatus(item, "published")}>প্রকাশ</button>}
                  {item.status === "published" && <button className="admin-small-action" onClick={() => updateStatus(item, "draft")}>অপ্রকাশিত করুন</button>}
                  <button className="admin-icon-button" onClick={() => startEdit(item)} aria-label={`সম্পাদনা করুন: ${item.title}`}><FiEdit2 /></button>
                  <button className="admin-icon-button danger" onClick={() => deleteItem(item)} aria-label={`মুছে ফেলুন: ${item.title}`}><FiTrash2 /></button>
                </div></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>

      {editorOpen && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditorOpen(false); }}>
          <section className="admin-editor-modal" role="dialog" aria-modal="true" aria-labelledby="admin-editor-title">
            <header className="admin-editor-header"><div><p className="admin-eyebrow">{form.id ? "রেকর্ড সম্পাদনা" : "নতুন রেকর্ড"}</p><h2 id="admin-editor-title">{form.id ? "কনটেন্ট সম্পাদনা" : "কনটেন্ট তৈরি"}</h2></div><button className="admin-icon-button" onClick={() => setEditorOpen(false)} aria-label="Close editor"><FiX /></button></header>
            <form className="admin-editor-form" onSubmit={saveContent}>
              <div className="admin-editor-grid">
                <Field label="Content type"><select name="content_type" value={form.content_type} onChange={change} disabled={Boolean(form.id)}>{contentTypes.map((type) => <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>)}</select></Field>
                <Field label="Publication status"><select name="status" value={form.status} onChange={change}>{statuses.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</select></Field>
                <Field label="Title" className="span-two"><input name="title" value={form.title} onChange={change} required maxLength={180} /></Field>
                <Field label="URL slug" hint="Lowercase letters, numbers and hyphens."><input name="slug" value={form.slug} onChange={change} placeholder={slugify(form.title) || "story-title"} pattern="[a-z0-9]+(-[a-z0-9]+)*" /></Field>
                <Field label="Category"><input name="category" value={form.category} onChange={change} maxLength={80} /></Field>
                <Field label="Summary" className="span-two"><textarea name="summary" value={form.summary} onChange={change} rows={3} maxLength={600} /></Field>
                <Field label={form.content_type === "video" ? "YouTube / Vimeo URL" : "Cover image URL"}>
                  {form.content_type === "video" ? <input name="video_url" type="url" value={form.video_url ?? ""} onChange={change} placeholder="https://www.youtube.com/watch?v=…" /> : <input name="image_url" type="url" value={form.image_url ?? ""} onChange={change} placeholder="https://… or /images/…" />}
                </Field>
                <Field label={form.content_type === "video" ? "Thumbnail URL" : "Tags"}>
                  {form.content_type === "video" ? <input name="image_url" type="url" value={form.image_url ?? ""} onChange={change} placeholder="https://…" /> : <input name="tags" value={form.tags} onChange={change} placeholder="Relief, Education" />}
                </Field>
                {form.content_type === "video" && <Field label="Playlist"><input name="playlist" value={form.playlist} onChange={change} placeholder="Optional playlist name" /></Field>}
                {form.status === "scheduled" && <Field label="Publish at" hint="The public site reveals scheduled content once this time is reached."><input name="scheduled_at" type="datetime-local" value={form.scheduled_at} onChange={change} required /></Field>}
                <Field label="Body / description" className="span-two"><textarea name="body" value={form.body} onChange={change} rows={7} /></Field>
                <Field label="SEO title"><input name="seo_title" value={form.seo_title} onChange={change} maxLength={70} /></Field>
                <Field label="SEO keywords" hint="Separate keywords with commas."><input name="seo_keywords" value={form.seo_keywords} onChange={change} /></Field>
                <Field label="SEO description" className="span-two"><textarea name="seo_description" value={form.seo_description} onChange={change} rows={2} maxLength={180} /></Field>
                <div className="admin-checkbox-row span-two">
                  <label><input name="is_featured" type="checkbox" checked={form.is_featured} onChange={change} /> Feature on the website</label>
                  {form.content_type === "news" && <label><input name="is_breaking" type="checkbox" checked={form.is_breaking} onChange={change} /> Mark as breaking news</label>}
                </div>
              </div>
              {formError && <p className="admin-form-alert" role="alert">{formError}</p>}
              <footer className="admin-editor-footer"><button className="admin-secondary-button" type="button" onClick={() => setEditorOpen(false)}>Cancel</button><button className="admin-primary-button" type="submit" disabled={saving}>{saving ? "Saving…" : form.id ? "Save changes" : "Create content"}</button></footer>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}

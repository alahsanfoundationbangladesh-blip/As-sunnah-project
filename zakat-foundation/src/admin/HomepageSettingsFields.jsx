import { FiImage } from "react-icons/fi";

const activities = [1, 2, 3];

function Field({ label, value, onChange, hint, maxLength = 180, multiline = false, canManage }) {
  const Control = multiline ? "textarea" : "input";
  return (
    <label className="admin-field">
      <span>{label}</span>
      <Control value={value} onChange={onChange} maxLength={maxLength} rows={multiline ? 3 : undefined} disabled={!canManage} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

function ImageField({ label, value, onChange, hint, alt, canManage }) {
  return (
    <div className="admin-home-image-field">
      <label className="admin-field">
        <span>{label}</span>
        <div className="admin-settings-input-icon">
          <FiImage aria-hidden="true" />
          <input type="text" value={value} onChange={onChange} placeholder="/images/photo.png বা HTTPS URL" disabled={!canManage} />
        </div>
        {hint && <small>{hint}</small>}
      </label>
      {value && <img className="admin-home-image-preview" src={value} alt={alt} loading="lazy" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} />}
    </div>
  );
}

export default function HomepageSettingsFields({ form, setForm, canManage }) {
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const mediaHint = "মিডিয়া লাইব্রেরি থেকে ছবির পাবলিক URL কপি করে এখানে দিন।";

  return (
    <section className="admin-homepage-settings" aria-labelledby="admin-homepage-settings-title">
      <div className="admin-settings-section-heading">
        <div><p className="admin-eyebrow">মূল পাতা</p><h3 id="admin-homepage-settings-title">হোমপেজের লেখা ও ছবি</h3></div>
      </div>
      <div className="admin-settings-grid">
        <Field label="হিরো অংশের ছোট শিরোনাম" value={form.home_eyebrow} onChange={update("home_eyebrow")} canManage={canManage} />
        <Field label="হিরো অংশের প্রধান শিরোনাম" value={form.home_heading} onChange={update("home_heading")} canManage={canManage} />
        <Field label="হিরো অংশের বিবরণ" value={form.home_description} onChange={update("home_description")} multiline maxLength={700} canManage={canManage} />
        <Field label="ছবির বিকল্প লেখা" value={form.home_hero_image_alt} onChange={update("home_hero_image_alt")} hint="স্ক্রিন রিডার ও ছবিটি লোড না হলে এই লেখা দেখা যায়।" canManage={canManage} />
        <ImageField label="প্রধান ছবি" value={form.home_hero_image_url} onChange={update("home_hero_image_url")} hint={mediaHint} alt="প্রধান ছবির প্রিভিউ" canManage={canManage} />
        <Field label="ছবির নিচের ক্যাপশন" value={form.home_image_caption} onChange={update("home_image_caption")} canManage={canManage} />
        <Field label="প্রধান বোতামের লেখা" value={form.home_primary_cta_label} onChange={update("home_primary_cta_label")} canManage={canManage} />
        <Field label="কার্যক্রমের বোতামের লেখা" value={form.home_secondary_cta_label} onChange={update("home_secondary_cta_label")} canManage={canManage} />
      </div>

      <div className="admin-settings-section-heading">
        <div><p className="admin-eyebrow">কার্যক্রম</p><h3>কার্যক্রম অংশ</h3></div>
      </div>
      <div className="admin-settings-grid">
        <Field label="ছোট শিরোনাম" value={form.home_activities_eyebrow} onChange={update("home_activities_eyebrow")} canManage={canManage} />
        <Field label="প্রধান শিরোনাম" value={form.home_activities_heading} onChange={update("home_activities_heading")} canManage={canManage} />
        <Field label="পরিচিতি" value={form.home_activities_description} onChange={update("home_activities_description")} multiline maxLength={500} canManage={canManage} />
        <Field label="সহায়তার বোতামের লেখা" value={form.home_activity_donate_label} onChange={update("home_activity_donate_label")} canManage={canManage} />
      </div>

      {activities.map((number) => (
        <div className="admin-homepage-activity" key={number}>
          <div className="admin-settings-section-heading">
            <div><p className="admin-eyebrow">কার্যক্রম {number.toLocaleString("bn-BD")}</p><h3>কার্যক্রমের তথ্য</h3></div>
          </div>
          <div className="admin-settings-grid">
            <Field label="শিরোনাম" value={form[`home_activity_${number}_title`]} onChange={update(`home_activity_${number}_title`)} canManage={canManage} />
            <Field label="ছবির বিকল্প লেখা" value={form[`home_activity_${number}_image_alt`]} onChange={update(`home_activity_${number}_image_alt`)} canManage={canManage} />
            <Field label="বিবরণ" value={form[`home_activity_${number}_description`]} onChange={update(`home_activity_${number}_description`)} multiline maxLength={500} canManage={canManage} />
            <ImageField label="কার্যক্রমের ছবি" value={form[`home_activity_${number}_image_url`]} onChange={update(`home_activity_${number}_image_url`)} hint={mediaHint} alt={`কার্যক্রম ${number.toLocaleString("bn-BD")} ছবির প্রিভিউ`} canManage={canManage} />
          </div>
        </div>
      ))}

      <div className="admin-settings-section-heading">
        <div><p className="admin-eyebrow">শেষ আহ্বান</p><h3>সহায়তার বার্তা</h3></div>
      </div>
      <div className="admin-settings-grid">
        <Field label="শিরোনাম" value={form.home_closing_title} onChange={update("home_closing_title")} canManage={canManage} />
        <Field label="বোতামের লেখা" value={form.home_closing_cta_label} onChange={update("home_closing_cta_label")} canManage={canManage} />
        <Field label="বিবরণ" value={form.home_closing_description} onChange={update("home_closing_description")} multiline maxLength={500} canManage={canManage} />
        <Field label="ফুটারের পরিচিতি" value={form.footer_description} onChange={update("footer_description")} multiline maxLength={250} canManage={canManage} />
      </div>
      {!canManage && <p className="admin-inline-alert" role="note">আপনার অনুমতি শুধু দেখা পর্যন্ত সীমিত।</p>}
    </section>
  );
}

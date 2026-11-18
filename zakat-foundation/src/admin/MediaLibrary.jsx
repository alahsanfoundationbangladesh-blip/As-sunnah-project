import { useRef, useState } from "react";
import useSWR, { mutate } from "swr";
import { FiFile, FiImage, FiTrash2, FiUploadCloud, FiVideo } from "react-icons/fi";
import { supabase } from "../lib/supabase";

const MEDIA_LIMIT = 20 * 1024 * 1024;

async function getMediaAssets() {
  const { data, error } = await supabase
    .from("media_assets")
    .select("id,file_name,storage_path,mime_type,file_size,alt_text,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

function getFileIcon(type) {
  if (type?.startsWith("image/")) return FiImage;
  if (type?.startsWith("video/")) return FiVideo;
  return FiFile;
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${new Intl.NumberFormat("bn-BD").format(Math.max(1, Math.round(bytes / 1024)))} কেবি`;
  return `${new Intl.NumberFormat("bn-BD", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(bytes / (1024 * 1024))} এমবি`;
}

export default function MediaLibrary({ onNotice, user }) {
  const inputRef = useRef(null);
  const { data = [], error, isLoading } = useSWR("admin-media-assets", getMediaAssets);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const uploadFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setErrorMessage("");

    if (file.size > MEDIA_LIMIT) {
      setErrorMessage("ফাইলের আকার ২০ এমবি বা তার কম হতে হবে।");
      return;
    }
    if (!file.type || !(file.type.startsWith("image/") || file.type.startsWith("video/") || file.type === "application/pdf" || file.type.includes("wordprocessingml"))) {
      setErrorMessage("ছবি, ভিডিও, PDF অথবা Word নথি আপলোড করুন।");
      return;
    }

    setUploading(true);
    const safeName = file.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-|-$/g, "").slice(-120);
    const storagePath = `${user.id}/${crypto.randomUUID()}-${safeName || "asset"}`;
    const { error: uploadError } = await supabase.storage.from("foundation-media").upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

    if (uploadError) {
      setErrorMessage("আপলোড করা যায়নি। মিডিয়া ব্যবহারের অনুমতি ও ফাইলের ধরন যাচাই করে আবার চেষ্টা করুন।");
      setUploading(false);
      return;
    }

    const { error: recordError } = await supabase.from("media_assets").insert({
      file_name: file.name,
      storage_path: storagePath,
      mime_type: file.type,
      file_size: file.size,
      uploaded_by: user.id,
      is_public: true,
    });

    if (recordError) {
      await supabase.storage.from("foundation-media").remove([storagePath]);
      setErrorMessage("ফাইল আপলোড হয়েছে, কিন্তু লাইব্রেরিতে সংরক্ষণ করা যায়নি। মিডিয়া ব্যবহারের অনুমতি যাচাই করুন।");
      setUploading(false);
      return;
    }

    await mutate("admin-media-assets");
    setUploading(false);
    onNotice("ফাইলটি ফাউন্ডেশনের সুরক্ষিত মিডিয়া লাইব্রেরিতে আপলোড হয়েছে।");
  };

  const deleteAsset = async (asset) => {
    if (!window.confirm(`“${asset.file_name}” মিডিয়া লাইব্রেরি থেকে সরাতে চান?`)) return;
    const { error: removeError } = await supabase.storage.from("foundation-media").remove([asset.storage_path]);
    if (removeError) {
      onNotice("স্টোরেজ থেকে ফাইলটি সরানো যায়নি। মিডিয়া ব্যবহারের অনুমতি যাচাই করুন।");
      return;
    }
    const { error: recordError } = await supabase.from("media_assets").delete().eq("id", asset.id);
    if (recordError) {
      onNotice("ফাইল সরানো হয়েছে, তবে লাইব্রেরির রেকর্ড মুছতে সমস্যা হয়েছে। রিফ্রেশ করে আবার চেষ্টা করুন।");
      await mutate("admin-media-assets");
      return;
    }
    await mutate("admin-media-assets");
    onNotice("স্টোরেজ ও মিডিয়া লাইব্রেরি থেকে ফাইলটি সরানো হয়েছে।");
  };

  return (
    <section className="admin-media-library">
      <div className="admin-media-intro admin-panel">
        <div className="admin-media-upload-icon"><FiUploadCloud aria-hidden="true" /></div>
        <div><h2>ফাউন্ডেশনের মিডিয়া আপলোড</h2><p>ছবি, ভিডিও, পিডিএফ ও ওয়ার্ড ফাইল আপলোড করুন। প্রতিটি ফাইল সর্বোচ্চ ২০ এমবি হতে পারবে।</p></div>
        <input ref={inputRef} className="sr-only" type="file" accept="image/*,video/*,application/pdf,.docx" onChange={uploadFile} aria-label="আপলোডের জন্য ফাইল বাছাই করুন" />
        <button className="admin-primary-button" onClick={() => inputRef.current?.click()} disabled={uploading}>{uploading ? "আপলোড হচ্ছে…" : "ফাইল বাছাই করুন"}</button>
      </div>

      {errorMessage && <div className="admin-inline-alert" role="alert">{errorMessage}</div>}
      {error && <div className="admin-inline-alert" role="alert">লাইব্রেরি লোড করা যায়নি। মিডিয়া ব্যবহারের অনুমতি যাচাই করে রিফ্রেশ করুন।</div>}

      <div className="admin-media-grid" aria-label="মিডিয়া ফাইলসমূহ">
        {isLoading ? <div className="admin-panel admin-empty-state">মিডিয়া ফাইল লোড হচ্ছে…</div> : data.map((asset) => {
          const Icon = getFileIcon(asset.mime_type);
          const { data: publicUrl } = supabase.storage.from("foundation-media").getPublicUrl(asset.storage_path);
          return (
            <article className="admin-media-card admin-panel" key={asset.id}>
              <div className="admin-media-preview">
                {asset.mime_type.startsWith("image/") ? <img src={publicUrl.publicUrl} alt={asset.alt_text || asset.file_name} loading="lazy" /> : <div className="admin-media-file-icon"><Icon aria-hidden="true" /><span>{asset.mime_type.split("/").pop()?.toUpperCase()}</span></div>}
                <button className="admin-media-delete admin-icon-button danger" onClick={() => deleteAsset(asset)} aria-label={`মুছে ফেলুন: ${asset.file_name}`}><FiTrash2 /></button>
              </div>
              <div className="admin-media-card-info"><strong title={asset.file_name}>{asset.file_name}</strong><span>{formatSize(asset.file_size)} · {new Intl.DateTimeFormat("bn-BD", { month: "short", day: "numeric", year: "numeric" }).format(new Date(asset.created_at))}</span><button className="admin-copy-link" onClick={async () => { await navigator.clipboard.writeText(publicUrl.publicUrl); onNotice("পাবলিক মিডিয়া URL কপি করা হয়েছে।"); }}>পাবলিক URL কপি করুন</button></div>
            </article>
          );
        })}
        {!isLoading && data.length === 0 && <div className="admin-panel admin-empty-state"><strong>এখনো কোনো মিডিয়া ফাইল নেই</strong><span>কনটেন্টে ব্যবহারের জন্য প্রথম ছবি, ভিডিও বা নথি আপলোড করুন।</span></div>}
      </div>
    </section>
  );
}

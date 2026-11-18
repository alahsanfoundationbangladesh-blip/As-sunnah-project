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
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
      setErrorMessage("Files must be 20 MB or smaller.");
      return;
    }
    if (!file.type || !(file.type.startsWith("image/") || file.type.startsWith("video/") || file.type === "application/pdf" || file.type.includes("wordprocessingml"))) {
      setErrorMessage("Upload an image, video, PDF or Word document.");
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
      setErrorMessage("Upload failed. Check your media permission and file type, then try again.");
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
      setErrorMessage("The file was uploaded but its library record could not be saved. Check your media permission.");
      setUploading(false);
      return;
    }

    await mutate("admin-media-assets");
    setUploading(false);
    onNotice("Media uploaded to the protected foundation library.");
  };

  const deleteAsset = async (asset) => {
    if (!window.confirm(`Remove “${asset.file_name}” from the media library?`)) return;
    const { error: removeError } = await supabase.storage.from("foundation-media").remove([asset.storage_path]);
    if (removeError) {
      onNotice("The file could not be removed from storage. Check your media permission.");
      return;
    }
    const { error: recordError } = await supabase.from("media_assets").delete().eq("id", asset.id);
    if (recordError) {
      onNotice("The file was removed, but the media record could not be deleted. Refresh and try again.");
      await mutate("admin-media-assets");
      return;
    }
    await mutate("admin-media-assets");
    onNotice("Media removed from storage and the library.");
  };

  return (
    <section className="admin-media-library">
      <div className="admin-media-intro admin-panel">
        <div className="admin-media-upload-icon"><FiUploadCloud aria-hidden="true" /></div>
        <div><h2>Upload foundation media</h2><p>Images, video, PDF and Word files · up to 20 MB per file. Uploaded assets are stored in Supabase Storage.</p></div>
        <input ref={inputRef} className="sr-only" type="file" accept="image/*,video/*,application/pdf,.docx" onChange={uploadFile} aria-label="Choose a file to upload" />
        <button className="admin-primary-button" onClick={() => inputRef.current?.click()} disabled={uploading}>{uploading ? "Uploading…" : "Choose file"}</button>
      </div>

      {errorMessage && <div className="admin-inline-alert" role="alert">{errorMessage}</div>}
      {error && <div className="admin-inline-alert" role="alert">The library could not be loaded. Check your media permissions and refresh.</div>}

      <div className="admin-media-grid" aria-label="Media assets">
        {isLoading ? <div className="admin-panel admin-empty-state">Loading media records…</div> : data.map((asset) => {
          const Icon = getFileIcon(asset.mime_type);
          const { data: publicUrl } = supabase.storage.from("foundation-media").getPublicUrl(asset.storage_path);
          return (
            <article className="admin-media-card admin-panel" key={asset.id}>
              <div className="admin-media-preview">
                {asset.mime_type.startsWith("image/") ? <img src={publicUrl.publicUrl} alt={asset.alt_text || asset.file_name} loading="lazy" /> : <div className="admin-media-file-icon"><Icon aria-hidden="true" /><span>{asset.mime_type.split("/").pop()?.toUpperCase()}</span></div>}
                <button className="admin-media-delete admin-icon-button danger" onClick={() => deleteAsset(asset)} aria-label={`Delete ${asset.file_name}`}><FiTrash2 /></button>
              </div>
              <div className="admin-media-card-info"><strong title={asset.file_name}>{asset.file_name}</strong><span>{formatSize(asset.file_size)} · {new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(asset.created_at))}</span><button className="admin-copy-link" onClick={async () => { await navigator.clipboard.writeText(publicUrl.publicUrl); onNotice("Public media URL copied to clipboard."); }}>Copy public URL</button></div>
            </article>
          );
        })}
        {!isLoading && data.length === 0 && <div className="admin-panel admin-empty-state"><strong>No media assets yet</strong><span>Upload your first image, video, or document to use it in content.</span></div>}
      </div>
    </section>
  );
}

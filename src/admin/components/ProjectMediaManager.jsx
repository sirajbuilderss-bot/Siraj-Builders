import { useCallback, useEffect, useState } from "react";
import { projectMedia, projects } from "../../services/content";
import { storage } from "../../lib/supabase";
import { toEmbed } from "../../lib/video";
import { clearPublicCache } from "../../services/publicData";
import { Alert, Loading, UploadButton } from "./ui";
import { log } from "../../services/activity";

/**
 * PROJECT MEDIA
 * Lives inside the project editor (edit mode). Every action saves straight
 * away — there is no separate "save" for photos — and the website reads the
 * same rows in the same order.
 *
 *   Images: upload many at once, paste a link, caption, alt text, reorder,
 *           set as featured (the card + case-study cover), delete.
 *   Videos: paste a YouTube / Vimeo / Drive link or upload an MP4, caption,
 *           reorder, delete.
 */
export default function ProjectMediaManager({ project, toast, onProjectChanged }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [featured, setFeatured] = useState(project.image_url || "");
  const [imageLink, setImageLink] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [confirmId, setConfirmId] = useState(null);

  const load = useCallback(async () => {
    try {
      setRows(await projectMedia.listForProject(project.id));
      setError("");
    } catch (err) {
      setRows([]);
      setError(
        /project_media/.test(err?.message || "")
          ? "The project_media table does not exist yet. Run database/migration-02-cms.sql in the Supabase SQL editor, then reload."
          : err?.message || "Could not load media."
      );
    }
  }, [project.id]);

  useEffect(() => {
    load();
  }, [load]);

  const images = (rows || []).filter((row) => row.kind === "image");
  const videos = (rows || []).filter((row) => row.kind === "video");

  async function run(task, success) {
    setBusy(true);
    try {
      await task();
      clearPublicCache();
      if (success) toast.show(success);
      await load();
    } catch (err) {
      toast.show(err?.message || "That did not save.", "error");
    } finally {
      setBusy(false);
    }
  }

  const add = (kind, items) =>
    run(async () => {
      const start = (kind === "image" ? images : videos).length;
      for (let i = 0; i < items.length; i += 1) {
        await projectMedia.create({
          project_id: project.id,
          kind,
          url: items[i].url,
          storage_path: items[i].path || "",
          sort_order: start + i,
        });
      }
      // The first photo becomes the featured image if there is none yet.
      if (kind === "image" && !featured && items[0]) {
        await projects.update(project.id, { image_url: items[0].url });
        setFeatured(items[0].url);
        onProjectChanged?.();
      }
      log("update", "projects", { entityId: project.id, summary: `Added ${items.length} ${kind}(s) to “${project.title}”` });
    }, `${items.length} ${kind === "image" ? (items.length > 1 ? "photos" : "photo") : items.length > 1 ? "videos" : "video"} added.`);

  const move = (list, index, step) =>
    run(async () => {
      const next = list.slice();
      const to = index + step;
      if (to < 0 || to >= next.length) return;
      [next[index], next[to]] = [next[to], next[index]];
      await projectMedia.reorder(next.map((row) => row.id));
    });

  const remove = (row) =>
    run(async () => {
      await projectMedia.remove(row.id);
      if (row.storage_path) {
        try {
          await storage.remove([row.storage_path]);
        } catch {
          /* the row is gone; an orphaned file is harmless */
        }
      }
      if (row.kind === "image" && row.url === featured) {
        const nextFeatured = images.find((img) => img.id !== row.id)?.url || "";
        await projects.update(project.id, { image_url: nextFeatured });
        setFeatured(nextFeatured);
        onProjectChanged?.();
      }
      setConfirmId(null);
    }, "Removed.");

  const setAsFeatured = (row) =>
    run(async () => {
      await projects.update(project.id, { image_url: row.url });
      setFeatured(row.url);
      onProjectChanged?.();
    }, "Featured image updated.");

  const saveField = (row, field, value) => {
    if ((row[field] || "") === value) return;
    run(() => projectMedia.update(row.id, { [field]: value }));
  };

  if (rows === null) return <Loading label="Loading photos and videos…" />;

  return (
    <section className="ad-media-manager" aria-label="Project photos and videos">
      <div className="ad-form-heading">
        <h3>Photos</h3>
        <p>
          Upload real project photography only. The <b>featured</b> photo is
          used on the project card and at the top of the case study. Drag order
          with the arrows; the gallery shows photos in this order.
        </p>
      </div>

      {error && (
        <Alert tone="error" title="Media is not available">
          {error}
        </Alert>
      )}

      {!error && (
        <>
          <div className="ad-media-actions">
            <UploadButton
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              folder={`projects/${project.id}`}
              label="Upload photos"
              className="ad-btn ad-btn-accent"
              onUploaded={(files) => add("image", files)}
            />
            <form
              className="ad-inline-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (!/^https?:\/\//i.test(imageLink.trim())) {
                  toast.show("Paste a full link starting with https://", "error");
                  return;
                }
                add("image", [{ url: imageLink.trim() }]);
                setImageLink("");
              }}
            >
              <input
                type="url"
                value={imageLink}
                onChange={(event) => setImageLink(event.target.value)}
                placeholder="…or paste an image link"
                aria-label="Image link"
              />
              <button className="ad-btn ad-btn-ghost ad-btn-sm" type="submit" disabled={busy || !imageLink.trim()}>
                Add link
              </button>
            </form>
          </div>

          {images.length === 0 ? (
            <p className="ad-media-empty">No photos yet. The project card shows a neutral placeholder until one is added.</p>
          ) : (
            <ul className="ad-media-grid">
              {images.map((row, index) => (
                <li key={row.id} className={row.url === featured ? "is-featured" : ""}>
                  <div className="ad-media-thumb">
                    <img src={row.url} alt={row.alt_text || ""} loading="lazy" />
                    <span className="ad-media-pos">{index + 1}</span>
                    {row.url === featured && <span className="ad-media-badge">Featured</span>}
                  </div>
                  <input
                    type="text"
                    defaultValue={row.caption}
                    placeholder="Caption (optional)"
                    aria-label={`Caption for photo ${index + 1}`}
                    onBlur={(event) => saveField(row, "caption", event.target.value.trim())}
                  />
                  <input
                    type="text"
                    defaultValue={row.alt_text}
                    placeholder="Describe the photo (for screen readers)"
                    aria-label={`Alt text for photo ${index + 1}`}
                    onBlur={(event) => saveField(row, "alt_text", event.target.value.trim())}
                  />
                  <div className="ad-media-tools">
                    <button type="button" className="ad-icon-btn" disabled={busy || index === 0} onClick={() => move(images, index, -1)} aria-label="Move photo earlier">
                      ←
                    </button>
                    <button type="button" className="ad-icon-btn" disabled={busy || index === images.length - 1} onClick={() => move(images, index, 1)} aria-label="Move photo later">
                      →
                    </button>
                    {row.url !== featured && (
                      <button type="button" className="ad-btn ad-btn-ghost ad-btn-sm" disabled={busy} onClick={() => setAsFeatured(row)}>
                        Set featured
                      </button>
                    )}
                    {confirmId === row.id ? (
                      <>
                        <button type="button" className="ad-btn ad-btn-danger ad-btn-sm" disabled={busy} onClick={() => remove(row)}>
                          Confirm delete
                        </button>
                        <button type="button" className="ad-btn ad-btn-ghost ad-btn-sm" onClick={() => setConfirmId(null)}>
                          Keep
                        </button>
                      </>
                    ) : (
                      <button type="button" className="ad-btn ad-btn-danger ad-btn-sm" disabled={busy} onClick={() => setConfirmId(row.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="ad-form-heading ad-media-videos-head">
            <h3>Videos</h3>
            <p>Paste a YouTube, Vimeo or Google Drive link, or upload a short MP4 (under 50 MB).</p>
          </div>

          <div className="ad-media-actions">
            <form
              className="ad-inline-form"
              onSubmit={(event) => {
                event.preventDefault();
                const link = videoLink.trim();
                if (!/^https?:\/\//i.test(link)) {
                  toast.show("Paste a full link starting with https://", "error");
                  return;
                }
                add("video", [{ url: link }]);
                setVideoLink("");
              }}
            >
              <input
                type="url"
                value={videoLink}
                onChange={(event) => setVideoLink(event.target.value)}
                placeholder="https://www.youtube.com/watch?v=…"
                aria-label="Video link"
              />
              <button className="ad-btn ad-btn-accent ad-btn-sm" type="submit" disabled={busy || !videoLink.trim()}>
                Add video link
              </button>
            </form>
            <UploadButton
              accept="video/mp4,video/webm"
              folder={`projects/${project.id}`}
              label="Upload MP4"
              onUploaded={(files) => add("video", files)}
            />
          </div>

          {videos.length === 0 ? (
            <p className="ad-media-empty">No videos yet.</p>
          ) : (
            <ul className="ad-video-list">
              {videos.map((row, index) => {
                const embed = toEmbed(row.url);
                return (
                  <li key={row.id}>
                    <div className="ad-video-info">
                      <b>Video {index + 1}</b>
                      <a href={row.url} target="_blank" rel="noreferrer">
                        {row.url}
                      </a>
                      {!embed && <span className="ad-field-error">Not a recognised video link — visitors will get an “Open video” link.</span>}
                      <input
                        type="text"
                        defaultValue={row.caption}
                        placeholder="Caption (optional)"
                        aria-label={`Caption for video ${index + 1}`}
                        onBlur={(event) => saveField(row, "caption", event.target.value.trim())}
                      />
                    </div>
                    <div className="ad-media-tools">
                      <button type="button" className="ad-icon-btn" disabled={busy || index === 0} onClick={() => move(videos, index, -1)} aria-label="Move video up">
                        ↑
                      </button>
                      <button type="button" className="ad-icon-btn" disabled={busy || index === videos.length - 1} onClick={() => move(videos, index, 1)} aria-label="Move video down">
                        ↓
                      </button>
                      {confirmId === row.id ? (
                        <button type="button" className="ad-btn ad-btn-danger ad-btn-sm" disabled={busy} onClick={() => remove(row)}>
                          Confirm delete
                        </button>
                      ) : (
                        <button type="button" className="ad-btn ad-btn-danger ad-btn-sm" disabled={busy} onClick={() => setConfirmId(row.id)}>
                          Delete
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

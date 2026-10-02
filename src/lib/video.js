/**
 * Turns whatever video link an admin pastes into something the browser can
 * play: an iframe embed for YouTube / Vimeo / Google Drive, or a <video>
 * element for a direct file (including uploads to the site-media bucket).
 *
 * Returns { kind: 'iframe' | 'file', src, thumb } or null for an
 * unrecognised link — the caller shows a plain "Open video" link instead.
 */
export function toEmbed(url) {
  const raw = String(url || "").trim();
  if (!raw) return null;
  let u;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, "");

  if (host === "youtu.be" || host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
    let id = "";
    if (host === "youtu.be") id = u.pathname.slice(1);
    else if (u.pathname.startsWith("/watch")) id = u.searchParams.get("v") || "";
    else {
      const m = u.pathname.match(/\/(embed|shorts|live)\/([^/?]+)/);
      id = m ? m[2] : "";
    }
    id = id.replace(/[^\w-]/g, "");
    if (!id) return null;
    return {
      kind: "iframe",
      src: `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
      thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }

  if (host.endsWith("vimeo.com")) {
    const m = u.pathname.match(/(\d{6,})/);
    if (!m) return null;
    return { kind: "iframe", src: `https://player.vimeo.com/video/${m[1]}`, thumb: "" };
  }

  if (host === "drive.google.com") {
    const m = u.pathname.match(/\/file\/d\/([^/]+)/) || [null, u.searchParams.get("id")];
    if (!m[1]) return null;
    return { kind: "iframe", src: `https://drive.google.com/file/d/${m[1]}/preview`, thumb: "" };
  }

  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(u.pathname) || u.pathname.includes("/storage/v1/object/public/")) {
    return { kind: "file", src: raw, thumb: "" };
  }

  return null;
}

export function isImageUrl(url) {
  return /\.(jpe?g|png|webp|gif|avif|svg)(\?|$)/i.test(String(url || ""));
}

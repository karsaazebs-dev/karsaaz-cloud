// Profile / personal-info helpers that fall outside the typed OCS client.
//
// The avatar endpoints live on the core app (not OCS) and use multipart upload,
// so they go through the Next.js same-origin proxy directly rather than through
// `apiFetch` (which forces JSON handling). Verified against the live backend and
// core/Controller/AvatarController.php:
//   POST   /index.php/avatar/    field name `files[]`, square jpeg/png
//                                 → { status: "success" } | { data: "notsquare", image }
//   DELETE /index.php/avatar/    → []
//   GET    /index.php/avatar/{user}/{64|512}

const AVATAR_BASE = "/api/proxy/index.php/avatar";

export interface AvatarUploadResult {
  status: "success" | "notsquare" | "error";
  /** base64 data-URI preview returned when the image is not square */
  image?: string;
  message?: string;
}

/** Upload a new avatar. The image must be a square jpeg/png. */
export async function uploadAvatar(file: File): Promise<AvatarUploadResult> {
  const body = new FormData();
  // The controller reads `files` as an array (`$files['tmp_name'][0]`), so the
  // multipart field must be `files[]`.
  body.append("files[]", file, file.name);

  const res = await fetch(`${AVATAR_BASE}/`, {
    method: "POST",
    body,
    headers: { "OCS-APIREQUEST": "true" },
  });

  const json = (await res.json().catch(() => null)) as
    | { status?: string; data?: unknown; image?: string }
    | null;

  if (json?.status === "success") {
    return { status: "success" };
  }
  if (json?.data === "notsquare") {
    return { status: "notsquare", image: json.image };
  }
  const message =
    json && typeof json.data === "object" && json.data !== null
      ? (json.data as { message?: string }).message
      : undefined;
  return { status: "error", message };
}

/** Remove the current custom avatar (reverts to the generated initials avatar). */
export async function deleteAvatar(): Promise<void> {
  const res = await fetch(`${AVATAR_BASE}/`, {
    method: "DELETE",
    headers: { "OCS-APIREQUEST": "true" },
  });
  if (!res.ok) {
    throw new Error(`Avatar delete failed: ${res.status}`);
  }
}

// Public share client — unauthenticated access to /index.php/s/{token} content
// via public WebDAV (/public.php/dav/files/{token}/). Runs in the browser and
// routes through the Next.js proxy. Password-protected shares authenticate with
// Basic auth using the token as username and the share password as password.

const DC_NS = "DAV:";

export interface PublicShareItem {
  name: string;
  path: string; // relative path within the share
  isDirectory: boolean;
  size: number;
  mimeType: string;
  lastModified: Date | null;
}

export interface PublicShareListing {
  items: PublicShareItem[];
  /** True when the share is a single file rather than a folder. */
  isSingleFile: boolean;
}

export class PublicShareError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "PublicShareError";
  }
  get requiresPassword() {
    return this.status === 401 || this.status === 403;
  }
}

function authHeader(token: string, password?: string): Record<string, string> {
  if (!password) return {};
  return { Authorization: `Basic ${btoa(`${token}:${password}`)}` };
}

function davRoot(token: string, subPath = ""): string {
  const clean = subPath.replace(/^\/+/, "");
  return `/api/proxy/public.php/dav/files/${encodeURIComponent(token)}/${clean}`;
}

const PROPFIND_BODY = `<?xml version="1.0"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:resourcetype/>
    <d:getcontentlength/>
    <d:getcontenttype/>
    <d:getlastmodified/>
  </d:prop>
</d:propfind>`;

/** List the contents of a public share (Depth 1). */
export async function listPublicShare(
  token: string,
  subPath = "",
  password?: string
): Promise<PublicShareListing> {
  const res = await fetch(davRoot(token, subPath), {
    method: "POST", // tunneled PROPFIND
    headers: {
      "Content-Type": "application/xml",
      Depth: "1",
      "X-HTTP-Method-Override": "PROPFIND",
      ...authHeader(token, password),
    },
    body: PROPFIND_BODY,
  });

  if (!res.ok) {
    throw new PublicShareError(res.status, `Share request failed (${res.status})`);
  }

  const xml = await res.text();
  const { items, rootIsFile } = parseListing(xml, token);
  return { items, isSingleFile: rootIsFile };
}

/** Download a file from the share, honoring an optional password. */
export async function downloadPublicFile(
  token: string,
  itemPath: string,
  fileName: string,
  password?: string
): Promise<void> {
  const res = await fetch(davRoot(token, itemPath), {
    headers: { ...authHeader(token, password) },
  });
  if (!res.ok) {
    throw new PublicShareError(res.status, `Download failed (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function parseListing(
  xml: string,
  token: string
): { items: PublicShareItem[]; rootIsFile: boolean } {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const responses = Array.from(doc.getElementsByTagNameNS(DC_NS, "response"));
  const items: PublicShareItem[] = [];
  let rootIsFile = false;

  const rootMarker = `/public.php/dav/files/${token}`;

  responses.forEach((resp, index) => {
    const hrefRaw =
      resp.getElementsByTagNameNS(DC_NS, "href")[0]?.textContent ?? "";
    const href = decodeURIComponent(hrefRaw);

    const isDirectory =
      resp.getElementsByTagNameNS(DC_NS, "collection").length > 0;

    const sizeText =
      resp.getElementsByTagNameNS(DC_NS, "getcontentlength")[0]?.textContent ?? "0";
    const mime =
      resp.getElementsByTagNameNS(DC_NS, "getcontenttype")[0]?.textContent ?? "";
    const modText =
      resp.getElementsByTagNameNS(DC_NS, "getlastmodified")[0]?.textContent ?? "";

    // The first response is the share root itself.
    const idx = href.indexOf(rootMarker);
    const rel = idx >= 0 ? href.slice(idx + rootMarker.length) : href;
    const relClean = rel.replace(/\/$/, "").replace(/^\/+/, "");

    if (index === 0) {
      rootIsFile = !isDirectory;
      if (isDirectory) return; // skip the folder container row
    }

    const name = relClean.split("/").pop() || token;

    items.push({
      name,
      path: relClean,
      isDirectory,
      size: Number(sizeText) || 0,
      mimeType: mime || (isDirectory ? "httpd/unix-directory" : "application/octet-stream"),
      lastModified: modText ? new Date(modText) : null,
    });
  });

  return { items, rootIsFile };
}

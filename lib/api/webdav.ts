// WebDAV typed client — wraps the `webdav` npm package

import {
  createClient,
  getPatcher,
  type WebDAVClient,
  type FileStat,
  type ResponseDataDetailed,
} from "webdav";
import type { KarsaazFile, FileVersion, TrashItem } from "@/lib/types/file.types";
import type { FileType } from "@/lib/types/file.types";

const BACKEND_URL =
  process.env.KARSAAZ_BACKEND_URL || "http://localhost:3030";

const WEBDAV_METHODS = ["PROPFIND", "MKCOL", "COPY", "MOVE", "PROPPATCH", "REPORT"];

// In browser context, route all WebDAV requests through Next.js proxy to avoid CORS.
// WebDAV-specific methods (PROPFIND etc.) are tunnelled as POST with X-HTTP-Method-Override.
if (typeof window !== "undefined") {
  getPatcher().patch("fetch", (url: unknown, options: unknown = {}) => {
    const strUrl = url as string;
    const init = (options as RequestInit) ?? {};
    let proxyUrl: string;
    try {
      const parsed = new URL(strUrl);
      proxyUrl = "/api/proxy" + parsed.pathname + parsed.search;
    } catch {
      proxyUrl = "/api/proxy" + strUrl;
    }
    const method = ((init.method as string) || "GET").toUpperCase();
    if (WEBDAV_METHODS.includes(method)) {
      return fetch(proxyUrl, {
        ...init,
        method: "POST",
        headers: {
          ...(init.headers as Record<string, string>),
          "X-HTTP-Method-Override": method,
        },
      });
    }
    return fetch(proxyUrl, init);
  });
}

/** Route a WebDAV fetch call through proxy when in browser context */
function webdavFetch(url: string, options: RequestInit): Promise<Response> {
  if (typeof window !== "undefined") {
    let proxyUrl: string;
    try {
      const parsed = new URL(url);
      proxyUrl = "/api/proxy" + parsed.pathname + parsed.search;
    } catch {
      proxyUrl = "/api/proxy" + url;
    }
    const method = ((options.method as string) || "GET").toUpperCase();
    if (WEBDAV_METHODS.includes(method)) {
      return fetch(proxyUrl, {
        ...options,
        method: "POST",
        headers: {
          ...(options.headers as Record<string, string>),
          "X-HTTP-Method-Override": method,
        },
      });
    }
    return fetch(proxyUrl, options);
  }
  return fetch(url, options);
}

const NC_WEBDAV_NS = "http://nextcloud.org/ns";
const OC_WEBDAV_NS = "http://owncloud.org/ns";

const PROPFIND_PROPERTIES = [
  "d:resourcetype",
  "d:getcontenttype",
  "d:getcontentlength",
  "d:getlastmodified",
  "d:getetag",
  "oc:id",
  "oc:fileid",
  "oc:permissions",
  "oc:size",
  "oc:favorite",
  "oc:owner-id",
  "oc:owner-display-name",
  "oc:share-types",
  "oc:tags",
  "nc:has-preview",
  "nc:note",
];

export function createWebDAVClient(
  username: string,
  password: string
): WebDAVClient {
  return createClient(`${BACKEND_URL}/remote.php/dav`, {
    username,
    password,
  });
}

/** MIME type → FileType mapping */
function mimeToFileType(mime: string, isDirectory: boolean): FileType {
  if (isDirectory) return "directory";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf") return "pdf";
  if (
    mime === "application/vnd.ms-excel" ||
    mime.includes("spreadsheetml") ||
    mime.includes("opendocument.spreadsheet")
  )
    return "spreadsheet";
  if (
    mime === "application/vnd.ms-powerpoint" ||
    mime.includes("presentationml") ||
    mime.includes("opendocument.presentation")
  )
    return "presentation";
  if (
    mime === "application/msword" ||
    mime.includes("wordprocessingml") ||
    mime.includes("opendocument.text")
  )
    return "document";
  if (
    mime === "application/zip" ||
    mime === "application/x-tar" ||
    mime === "application/x-rar-compressed" ||
    mime === "application/x-7z-compressed"
  )
    return "archive";
  if (mime.startsWith("text/") || mime.includes("json") || mime.includes("xml"))
    return "text";
  return "other";
}

/** Map a FileStat from `webdav` to our KarsaazFile shape */
export function fileStatToKarsaazFile(stat: FileStat): KarsaazFile {
  const props = ((stat as FileStat & { props?: Record<string, unknown> }).props ?? {}) as Record<string, unknown>;
  const isDirectory = stat.type === "directory";
  const mime = (stat.mime as string) || (isDirectory ? "httpd/unix-directory" : "application/octet-stream");

  const shareTypes = (() => {
    const st = props["oc:share-types"] as { "oc:share-type"?: unknown } | undefined;
    if (!st) return [];
    const raw = st["oc:share-type"];
    if (Array.isArray(raw)) return raw.map(Number);
    if (raw !== undefined) return [Number(raw)];
    return [];
  })();

  return {
    id: String(props["oc:id"] ?? stat.filename),
    fileId: Number(props["oc:fileid"] ?? 0),
    name: stat.basename,
    path: stat.filename,
    type: isDirectory ? "directory" : "file",
    mimeType: mime,
    fileType: mimeToFileType(mime, isDirectory),
    size: Number(stat.size ?? props["oc:size"] ?? 0),
    lastModified: new Date(stat.lastmod),
    etag: (stat.etag as string) || "",
    permissions: Number(props["oc:permissions"] ?? 0),
    isFavorite: Number(props["oc:favorite"]) === 1,
    isShared: shareTypes.length > 0,
    shareTypes,
    tags: Array.isArray(props["oc:tags"]) ? (props["oc:tags"] as string[]) : [],
    hasPreview: Boolean(props["nc:has-preview"]),
    thumbnailUrl: undefined,
    ownerId: props["oc:owner-id"] as string | undefined,
    ownerDisplayName: props["oc:owner-display-name"] as string | undefined,
  };
}

/** List directory contents */
export async function listDirectory(
  client: WebDAVClient,
  username: string,
  path: string
): Promise<KarsaazFile[]> {
  const davPath = `/files/${username}${path === "/" ? "" : path}`;
  const stats = await client.getDirectoryContents(davPath, {
    deep: false,
    details: false,
    data: `<?xml version="1.0"?>
      <d:propfind xmlns:d="DAV:" xmlns:oc="${OC_WEBDAV_NS}" xmlns:nc="${NC_WEBDAV_NS}">
        <d:prop>
          ${PROPFIND_PROPERTIES.map((p) => `<${p}/>`).join("")}
        </d:prop>
      </d:propfind>`,
  });

  const items = Array.isArray(stats) ? stats : (stats as ResponseDataDetailed<FileStat[]>).data;
  return items
    .filter((s) => s.filename !== davPath)
    .map(fileStatToKarsaazFile);
}

/** Get single file/folder stat */
export async function getStat(
  client: WebDAVClient,
  username: string,
  path: string
): Promise<KarsaazFile | null> {
  try {
    const stat = await client.stat(`/files/${username}${path}`, {
      details: false,
    }) as FileStat;
    return fileStatToKarsaazFile(stat);
  } catch {
    return null;
  }
}

/** Create folder */
export async function createDirectory(
  client: WebDAVClient,
  username: string,
  path: string
): Promise<void> {
  await client.createDirectory(`/files/${username}${path}`);
}

/** Delete file or directory */
export async function deleteItem(
  client: WebDAVClient,
  username: string,
  path: string
): Promise<void> {
  await client.deleteFile(`/files/${username}${path}`);
}

/** Move / rename */
export async function moveItem(
  client: WebDAVClient,
  username: string,
  sourcePath: string,
  destPath: string
): Promise<void> {
  await client.moveFile(
    `/files/${username}${sourcePath}`,
    `/files/${username}${destPath}`
  );
}

/** Copy */
export async function copyItem(
  client: WebDAVClient,
  username: string,
  sourcePath: string,
  destPath: string
): Promise<void> {
  await client.copyFile(
    `/files/${username}${sourcePath}`,
    `/files/${username}${destPath}`
  );
}

/** Get download URL — uses proxy path in browser to avoid CORS */
export function getDownloadUrl(
  username: string,
  path: string,
  _basicAuth?: string
): string {
  const base = typeof window !== "undefined" ? "/api/proxy" : BACKEND_URL;
  return `${base}/remote.php/dav/files/${username}${path}`;
}

/** List file versions */
export async function listVersions(
  client: WebDAVClient,
  username: string,
  fileId: number
): Promise<FileVersion[]> {
  const stats = await client.getDirectoryContents(
    `/versions/${username}/versions/${fileId}`,
    { deep: false, details: false }
  );

  const items = Array.isArray(stats)
    ? stats
    : (stats as ResponseDataDetailed<FileStat[]>).data;

  return items.map((s) => ({
    id: s.filename,
    fileId,
    label: s.basename,
    timestamp: new Date(s.lastmod),
    size: Number(s.size ?? 0),
    mimeType: (s.mime as string) || "application/octet-stream",
    href: s.filename,
  }));
}

/** List trash bin */
export async function listTrash(
  client: WebDAVClient,
  username: string
): Promise<TrashItem[]> {
  const stats = await client.getDirectoryContents(
    `/trashbin/${username}/trash`,
    { deep: false, details: false }
  );

  const items = Array.isArray(stats)
    ? stats
    : (stats as ResponseDataDetailed<FileStat[]>).data;

  return items
    .filter((s) => s.filename !== `/trashbin/${username}/trash`)
    .map((s) => {
      const props = ((s as FileStat & { props?: Record<string, unknown> }).props ?? {}) as Record<string, unknown>;
      return {
        id: s.filename,
        originalLocation: (props["nc:trashbin-original-location"] as string) || "",
        name: (props["nc:trashbin-filename"] as string) || s.basename,
        deletedAt: new Date(Number(props["nc:trashbin-deletion-time"] ?? 0) * 1000),
        size: Number(s.size ?? 0),
        mimeType: (s.mime as string) || "application/octet-stream",
        type: s.type as "file" | "directory",
        href: s.filename,
      };
    });
}

/** Restore trash item */
export async function restoreTrashItem(
  client: WebDAVClient,
  username: string,
  trashHref: string,
  filename: string
): Promise<void> {
  await client.moveFile(
    trashHref,
    `/trashbin/${username}/restore/${filename}`
  );
}

/** Toggle favorite via PROPPATCH */
export async function setFavorite(
  username: string,
  path: string,
  favorite: boolean,
  basicAuth: string
): Promise<void> {
  const value = favorite ? 1 : 0;
  const body = `<?xml version="1.0"?>
    <d:propertyupdate xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">
      <d:set>
        <d:prop>
          <oc:favorite>${value}</oc:favorite>
        </d:prop>
      </d:set>
    </d:propertyupdate>`;

  await webdavFetch(
    `${BACKEND_URL}/remote.php/dav/files/${username}${path}`,
    {
      method: "PROPPATCH",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/xml",
      },
      body,
    }
  );
}

// ─── Simple-auth wrappers (accept { basicAuth } options) ─────────────────────
// These let hooks call the WebDAV API with just a basicAuth token —
// they decode username:password from the base64 token and create the client.

interface AuthOptions {
  basicAuth: string;
}

function decodeAuth(basicAuth: string): { username: string; password: string } {
  try {
    const decoded = atob(basicAuth);
    const colon = decoded.indexOf(":");
    if (colon === -1) return { username: decoded, password: "" };
    return { username: decoded.slice(0, colon), password: decoded.slice(colon + 1) };
  } catch {
    return { username: "", password: "" };
  }
}

export async function listFiles(
  davPath: string,
  opts: AuthOptions
): Promise<KarsaazFile[]> {
  const { username, password } = decodeAuth(opts.basicAuth);
  const client = createWebDAVClient(username, password);
  // davPath is already the full WebDAV path e.g. /remote.php/dav/files/admin/
  // strip the /remote.php/dav prefix since the client base URL already includes it
  const relativePath = davPath.replace(/^\/remote\.php\/dav/, "");
  const stats = await client.getDirectoryContents(relativePath, {
    deep: false,
    details: false,
    data: `<?xml version="1.0"?>
      <d:propfind xmlns:d="DAV:" xmlns:oc="${OC_WEBDAV_NS}" xmlns:nc="${NC_WEBDAV_NS}">
        <d:prop>
          ${PROPFIND_PROPERTIES.map((p) => `<${p}/>`).join("")}
        </d:prop>
      </d:propfind>`,
  });
  const items = Array.isArray(stats) ? stats : (stats as ResponseDataDetailed<FileStat[]>).data;
  return items
    .filter((s) => s.filename !== relativePath && s.filename !== relativePath + "/")
    .map(fileStatToKarsaazFile);
}

export async function listFilesDeep(
  davPath: string,
  opts: AuthOptions
): Promise<KarsaazFile[]> {
  const { username, password } = decodeAuth(opts.basicAuth);
  const client = createWebDAVClient(username, password);
  const relativePath = davPath.replace(/^\/remote\.php\/dav/, "");
  try {
    const stats = await client.getDirectoryContents(relativePath, {
      deep: true,
      details: false,
      data: `<?xml version="1.0"?>
        <d:propfind xmlns:d="DAV:" xmlns:oc="${OC_WEBDAV_NS}" xmlns:nc="${NC_WEBDAV_NS}">
          <d:prop>
            ${PROPFIND_PROPERTIES.map((p) => `<${p}/>`).join("")}
          </d:prop>
        </d:propfind>`,
    });
    const items = Array.isArray(stats) ? stats : (stats as ResponseDataDetailed<FileStat[]>).data;
    return items
      .filter((s) => s.filename !== relativePath && s.filename !== relativePath + "/")
      .map(fileStatToKarsaazFile);
  } catch {
    return [];
  }
}

export async function createFolder(
  davPath: string,
  opts: AuthOptions
): Promise<void> {
  const { username, password } = decodeAuth(opts.basicAuth);
  const client = createWebDAVClient(username, password);
  const relativePath = davPath.replace(/^\/remote\.php\/dav/, "");
  await client.createDirectory(relativePath);
}

export async function createFile(
  davPath: string,
  mimeType: string,
  opts: AuthOptions
): Promise<void> {
  // PUT an empty file with the correct MIME type so the office editor initialises it
  await webdavFetch(`${BACKEND_URL}${davPath}`, {
    method: "PUT",
    headers: {
      Authorization: `Basic ${opts.basicAuth}`,
      "Content-Type": mimeType,
      "Content-Length": "0",
    },
    body: "",
  });
}

export async function deleteFile(
  davPath: string,
  opts: AuthOptions
): Promise<void> {
  const { username, password } = decodeAuth(opts.basicAuth);
  const client = createWebDAVClient(username, password);
  const relativePath = davPath.replace(/^\/remote\.php\/dav/, "");
  await client.deleteFile(relativePath);
}

export async function moveFile(
  fromDavPath: string,
  toDavPath: string,
  opts: AuthOptions
): Promise<void> {
  const { username, password } = decodeAuth(opts.basicAuth);
  const client = createWebDAVClient(username, password);
  const from = fromDavPath.replace(/^\/remote\.php\/dav/, "");
  const to = toDavPath.replace(/^\/remote\.php\/dav/, "");
  await client.moveFile(from, to);
}

export async function copyFile(
  fromDavPath: string,
  toDavPath: string,
  opts: AuthOptions
): Promise<void> {
  const { username, password } = decodeAuth(opts.basicAuth);
  const client = createWebDAVClient(username, password);
  const from = fromDavPath.replace(/^\/remote\.php\/dav/, "");
  const to = toDavPath.replace(/^\/remote\.php\/dav/, "");
  await client.copyFile(from, to);
}

export async function toggleFavorite(
  davPath: string,
  favorite: boolean,
  opts: AuthOptions
): Promise<void> {
  const { username, password } = decodeAuth(opts.basicAuth);
  // Extract the user/path portion from the WebDAV path
  const match = davPath.match(/\/remote\.php\/dav\/files\/([^/]+)(\/.*)?$/);
  if (!match) return;
  const user = decodeURIComponent(match[1]);
  const filePath = match[2] ?? "/";
  await setFavorite(user, filePath, favorite, opts.basicAuth);
}

export async function getVersions(
  fileId: number,
  opts: AuthOptions
): Promise<FileVersion[]> {
  const { username, password } = decodeAuth(opts.basicAuth);
  const client = createWebDAVClient(username, password);
  return listVersions(client, username, fileId);
}

export async function getTrashItems(opts: AuthOptions): Promise<TrashItem[]> {
  const { username, password } = decodeAuth(opts.basicAuth);
  const client = createWebDAVClient(username, password);
  return listTrash(client, username);
}

export async function restoreItem(
  trashHref: string,
  filename: string,
  opts: AuthOptions
): Promise<void> {
  const { username, password } = decodeAuth(opts.basicAuth);
  const client = createWebDAVClient(username, password);
  await restoreTrashItem(client, username, trashHref, filename);
}

export async function deleteTrashItem(
  trashHref: string,
  opts: AuthOptions
): Promise<void> {
  const { username, password } = decodeAuth(opts.basicAuth);
  const client = createWebDAVClient(username, password);
  await client.deleteFile(trashHref);
}

export async function emptyTrash(opts: AuthOptions): Promise<void> {
  const { username, password } = decodeAuth(opts.basicAuth);
  const client = createWebDAVClient(username, password);
  await client.deleteFile(`/trashbin/${username}/trash`);
}

export async function listFavorites(opts: AuthOptions): Promise<KarsaazFile[]> {
  const { username, password } = decodeAuth(opts.basicAuth);
  const body = `<?xml version="1.0"?>
    <oc:filter-files xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns" xmlns:nc="http://nextcloud.org/ns">
      <d:prop>
        ${PROPFIND_PROPERTIES.map((p) => `<${p}/>`).join("")}
      </d:prop>
      <oc:filter-rules>
        <oc:favorite>1</oc:favorite>
      </oc:filter-rules>
    </oc:filter-files>`;
  const response = await webdavFetch(
    `${BACKEND_URL}/remote.php/dav/files/${encodeURIComponent(username)}/`,
    {
      method: "REPORT",
      headers: {
        Authorization: `Basic ${opts.basicAuth}`,
        "Content-Type": "application/xml",
        Depth: "infinity",
      },
      body,
    }
  );
  if (!response.ok) return [];
  // The REPORT response is XML — parse file paths from href elements
  const text = await response.text();
  const hrefMatches = text.matchAll(/<d:href>([^<]+)<\/d:href>/g);
  const paths: string[] = [];
  for (const m of hrefMatches) {
    const href = decodeURIComponent(m[1]);
    if (!href.endsWith(`/files/${username}/`) && href.includes(`/files/${username}/`)) {
      paths.push(href);
    }
  }
  if (paths.length === 0) return [];
  // Fetch stat for each favorite file
  const client = createWebDAVClient(username, password);
  const results: KarsaazFile[] = [];
  for (const href of paths) {
    try {
      const relativePath = href.replace(/^.*?\/remote\.php\/dav/, "");
      const stat = await client.stat(relativePath, { details: false }) as FileStat;
      results.push(fileStatToKarsaazFile(stat));
    } catch {
      // skip items that fail
    }
  }
  return results;
}


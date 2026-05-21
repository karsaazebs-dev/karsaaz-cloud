// Comments DAV client (comments app) — talks to /remote.php/dav/comments/files/{fileId}
// Runs in the browser and routes through the Next.js proxy.

import type { FileComment } from "@/lib/types/file.types";

const OC_NS = "http://owncloud.org/ns";

interface AuthOptions {
  basicAuth: string;
}

function commentsUrl(fileId: number, suffix = ""): string {
  return `/api/proxy/remote.php/dav/comments/files/${fileId}${suffix}`;
}

/** List comments for a file, newest first. */
export async function listComments(
  fileId: number,
  opts: AuthOptions,
  limit = 50,
  offset = 0
): Promise<FileComment[]> {
  const body = `<?xml version="1.0"?>
    <oc:filter-comments xmlns:oc="${OC_NS}">
      <oc:limit>${limit}</oc:limit>
      <oc:offset>${offset}</oc:offset>
    </oc:filter-comments>`;

  const res = await fetch(commentsUrl(fileId), {
    method: "POST",
    headers: {
      Authorization: `Basic ${opts.basicAuth}`,
      "Content-Type": "application/xml",
      "X-HTTP-Method-Override": "REPORT",
    },
    body,
  });

  if (!res.ok) {
    // 404 == comments node not yet created for this file → no comments
    if (res.status === 404) return [];
    throw new Error(`Failed to load comments (${res.status})`);
  }

  const text = await res.text();
  return parseComments(text);
}

/** Post a new comment on a file. */
export async function createComment(
  fileId: number,
  message: string,
  opts: AuthOptions
): Promise<void> {
  const res = await fetch(commentsUrl(fileId), {
    method: "POST",
    headers: {
      Authorization: `Basic ${opts.basicAuth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ actorType: "users", verb: "comment", message }),
  });
  if (!res.ok) throw new Error(`Failed to post comment (${res.status})`);
}

/** Delete a comment by id. */
export async function deleteComment(
  fileId: number,
  commentId: string,
  opts: AuthOptions
): Promise<void> {
  const res = await fetch(commentsUrl(fileId, `/${commentId}`), {
    method: "DELETE",
    headers: { Authorization: `Basic ${opts.basicAuth}` },
  });
  if (!res.ok) throw new Error(`Failed to delete comment (${res.status})`);
}

function parseComments(xml: string): FileComment[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const responses = Array.from(doc.getElementsByTagNameNS("DAV:", "response"));
  const comments: FileComment[] = [];

  for (const resp of responses) {
    const get = (local: string): string =>
      resp.getElementsByTagNameNS(OC_NS, local)[0]?.textContent?.trim() ?? "";

    const id = get("id");
    if (!id) continue; // skip the collection itself

    const created = get("creationDateTime");
    comments.push({
      id,
      message: get("message"),
      actorId: get("actorId"),
      actorType: get("actorType"),
      actorDisplayName: get("actorDisplayName"),
      creationDateTime: created ? new Date(created) : new Date(0),
      verb: get("verb"),
      isUnread: get("isUnread") === "true",
    });
  }

  // Newest first
  return comments.sort(
    (a, b) => b.creationDateTime.getTime() - a.creationDateTime.getTime()
  );
}

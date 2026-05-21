import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.KARSAAZ_BACKEND_URL ?? "http://localhost:3030";

/**
 * GET /api/office-token?path=<filepath>
 *
 * Asks Karsaaz Cloud (Nextcloud + richdocuments) for a WOPI editor URL for
 * the given file path. Returns { url: string } pointing at the Collabora
 * editor iframe.
 *
 * Nextcloud's richdocuments app exposes:
 *   POST /apps/richdocuments/token?fileid=<numeric>
 * and
 *   GET  /apps/richdocuments/open?fileId=<numeric>
 *
 * We first resolve the numeric file ID via PROPFIND (WebDAV), then build
 * the direct editor URL.
 */
export async function GET(req: NextRequest) {
  const basicAuth = req.headers.get("x-basic-auth");
  const filePath = req.nextUrl.searchParams.get("path");

  if (!basicAuth || !filePath) {
    return NextResponse.json({ error: "Missing auth or path" }, { status: 400 });
  }

  try {
    // PROPFIND to get the numeric OC-FileId
    const davUrl = `${BACKEND_URL}/remote.php/dav/files/${await resolveUsername(basicAuth)}${filePath}`;
    const propfind = await fetch(davUrl, {
      method: "PROPFIND",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        Depth: "0",
        "Content-Type": "application/xml",
      },
      body: `<?xml version="1.0"?><D:propfind xmlns:D="DAV:" xmlns:OC="http://owncloud.org/ns"><D:prop><OC:fileid/></D:prop></D:propfind>`,
    });

    if (!propfind.ok) {
      throw new Error(`PROPFIND failed: ${propfind.status}`);
    }

    const xml = await propfind.text();
    const match = xml.match(/<oc:fileid[^>]*>(\d+)<\/oc:fileid>/i);
    const fileId = match?.[1];

    if (!fileId) {
      // Fallback: just open via path-based NC URL
      const url = `${BACKEND_URL}/apps/richdocuments/open?path=${encodeURIComponent(filePath)}`;
      return NextResponse.json({ url });
    }

    // Build the direct richdocuments open URL
    const url = `${BACKEND_URL}/apps/richdocuments/open?fileId=${fileId}`;
    return NextResponse.json({ url });
  } catch (e) {
    console.error("office-token route error:", e);
    return NextResponse.json(
      { error: "Failed to resolve editor URL", detail: String(e) },
      { status: 500 }
    );
  }
}

async function resolveUsername(basicAuth: string): Promise<string> {
  try {
    const res = await fetch(`${BACKEND_URL}/ocs/v2.php/cloud/user?format=json`, {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "OCS-APIREQUEST": "true",
      },
    });
    const json = (await res.json()) as { ocs?: { data?: { id?: string } } };
    return json.ocs?.data?.id ?? atob(basicAuth).split(":")[0];
  } catch {
    return atob(basicAuth).split(":")[0];
  }
}

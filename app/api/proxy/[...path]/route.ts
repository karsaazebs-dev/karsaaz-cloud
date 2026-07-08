// Transparent authenticated proxy — forwards all requests to Karsaaz Cloud backend

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const BACKEND_URL =
  process.env.KARSAAZ_BACKEND_URL || "http://localhost:3030";

const BLOCKED_RESPONSE_HEADERS = new Set([
  "set-cookie",
  "transfer-encoding",
  // fetch() transparently decompresses the body and drops content-encoding, so
  // the upstream content-length no longer matches the bytes we forward. Strip
  // both to avoid ERR_CONTENT_LENGTH_MISMATCH; the response is sent unsized.
  "content-encoding",
  "content-length",
  "connection",
  "keep-alive",
  "upgrade",
  // Nextcloud answers an unauthenticated/expired credential with
  // `401 WWW-Authenticate: Basic realm="Nextcloud"`. Forwarding that header to
  // the browser makes it pop its native OS-level Basic-auth sign-in dialog
  // (the "Sign in — http://localhost:3000" prompt). This app authenticates via
  // its own NextAuth session, so the challenge must never reach the browser:
  // strip it and let the SPA treat the 401 as a normal "re-login" signal.
  "www-authenticate",
]);

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await auth();

  const { path } = await params;
  const targetPath = "/" + path.join("/");
  const targetUrl = new URL(targetPath, BACKEND_URL);

  // Forward query string
  req.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  // Build headers — add auth if session exists
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!["host", "connection", "content-length"].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  headers.set("OCS-APIREQUEST", "true");

  const basicAuth = (session as Record<string, unknown> | null)?.basicAuth as string | undefined;
  if (basicAuth) {
    headers.set("Authorization", `Basic ${basicAuth}`);
  }

  // Support X-HTTP-Method-Override for WebDAV tunneling (PROPFIND, MKCOL, COPY, MOVE, etc.)
  const methodOverride = req.headers.get("x-http-method-override");
  const method = (methodOverride || req.method).toUpperCase();
  headers.delete("x-http-method-override");

  let body: BodyInit | undefined;
  if (!["GET", "HEAD"].includes(method)) {
    body = await req.blob();
  }

  try {
    const backendResponse = await fetch(targetUrl.toString(), {
      method,
      headers,
      body,
      redirect: "follow",
    });

    // Build response headers (strip hop-by-hop)
    const responseHeaders = new Headers();
    backendResponse.headers.forEach((value, key) => {
      if (!BLOCKED_RESPONSE_HEADERS.has(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });
    responseHeaders.set("X-Proxy-By", "Karsaaz-Cloud-Next");

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[proxy] Backend unreachable:", error);
    return NextResponse.json(
      { error: "Backend unreachable" },
      { status: 502 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const HEAD = handler;
export const OPTIONS = handler;

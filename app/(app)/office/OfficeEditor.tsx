"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { getBackendOrigin } from "@/lib/utils/backend";
import { ArrowLeft, Maximize2, Minimize2 } from "lucide-react";

type SessionData = { basicAuth?: string; username?: string } & Record<string, unknown>;

export function OfficeEditor() {
  const params = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const s = session as SessionData | null;
  const basicAuth = s?.basicAuth as string | undefined;

  const filePath = params.get("path") ?? "";
  const fileName = filePath.split("/").pop() ?? "Document";

  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filePath || !basicAuth) return;

    async function fetchEditorUrl() {
      try {
        const res = await fetch(
          `/api/office-token?path=${encodeURIComponent(filePath)}`,
          { headers: { "x-basic-auth": basicAuth! } }
        );
        if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);
        const { url } = (await res.json()) as { url: string };
        setIframeUrl(url);
      } catch (e) {
        const ncUrl = `${getBackendOrigin()}/apps/richdocuments/open?path=${encodeURIComponent(filePath)}`;
        setIframeUrl(ncUrl);
        console.warn("Office token fetch failed, falling back to NC URL:", e);
      }
    }

    fetchEditorUrl();
  }, [filePath, basicAuth]);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  }

  return (
    <div className="flex flex-col h-full" ref={containerRef}>
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-background shrink-0">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Files
        </Button>
        <div className="flex-1 text-sm font-medium truncate">{fileName}</div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleFullscreen}>
          {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex-1 relative">
        {!iframeUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Opening {fileName}…</p>
            </div>
          </div>
        )}
        {iframeUrl && (
          <iframe
            src={iframeUrl}
            className="w-full h-full border-0"
            allow="fullscreen"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"
            onError={() => setError("The editor could not be loaded.")}
            title={`Editing ${fileName}`}
          />
        )}
      </div>
    </div>
  );
}

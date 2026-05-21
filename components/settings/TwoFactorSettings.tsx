"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Copy, Check, Download } from "lucide-react";
import { useBackupCodesState, useCreateBackupCodes } from "@/lib/hooks/useTwoFactor";

export function TwoFactorSettings() {
  const { data: state, isLoading } = useBackupCodesState();
  const create = useCreateBackupCodes();
  const [codes, setCodes] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);

  function generate() {
    create.mutate(undefined, { onSuccess: (data) => setCodes(data.codes) });
  }

  function copyAll() {
    if (!codes) return;
    navigator.clipboard.writeText(codes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function downloadAll() {
    if (!codes) return;
    const blob = new Blob([codes.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "karsaaz-backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const remaining = state ? state.total - state.used : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4" />
          Two-factor backup codes
          {state?.enabled && (
            <Badge variant="secondary" className="ml-1 text-[10px]">
              Active
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          One-time codes you can use to sign in if you lose access to your second factor.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            {state?.enabled ? (
              <p className="text-sm text-muted-foreground">
                {remaining} of {state.total} codes remaining.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No backup codes generated yet.
              </p>
            )}

            {codes && (
              <div className="rounded-md border bg-muted/40 p-3 space-y-3">
                <p className="text-xs text-muted-foreground">
                  Save these codes now — each works once and they won&apos;t be shown again.
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-sm">
                  {codes.map((c) => (
                    <span key={c}>{c}</span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={copyAll}>
                    {copied ? <Check className="h-4 w-4 mr-1.5 text-green-600" /> : <Copy className="h-4 w-4 mr-1.5" />}
                    Copy
                  </Button>
                  <Button size="sm" variant="outline" onClick={downloadAll}>
                    <Download className="h-4 w-4 mr-1.5" />
                    Download
                  </Button>
                </div>
              </div>
            )}

            <Button onClick={generate} disabled={create.isPending} variant={state?.enabled ? "outline" : "default"}>
              {create.isPending
                ? "Generating…"
                : state?.enabled
                  ? "Regenerate backup codes"
                  : "Generate backup codes"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { KeyRound, Trash2, Plus, Copy, Check } from "lucide-react";
import {
  useOAuth2Clients,
  useCreateOAuth2Client,
  useDeleteOAuth2Client,
} from "@/lib/hooks/useOAuth2";
import type { OAuth2Client } from "@/lib/api/oauth2";

export default function AdminSecurityPage() {
  const { data: clients, isLoading } = useOAuth2Clients();
  const createClient = useCreateOAuth2Client();
  const deleteClient = useDeleteOAuth2Client();

  const [name, setName] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [created, setCreated] = useState<OAuth2Client | null>(null);

  function create() {
    if (!name.trim() || !redirectUri.trim()) return;
    createClient.mutate(
      { name: name.trim(), redirectUri: redirectUri.trim() },
      {
        onSuccess: (client) => {
          setCreated(client);
          setName("");
          setRedirectUri("");
        },
      }
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Security</h1>
        <p className="text-muted-foreground text-sm">OAuth2 clients allowed to access the API on behalf of users.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4" />
            OAuth2 clients
          </CardTitle>
          <CardDescription>Registered third-party applications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {isLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : !clients || clients.length === 0 ? (
              <p className="text-sm text-muted-foreground">No OAuth2 clients registered.</p>
            ) : (
              clients.map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.redirectUri}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{c.clientId}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteClient.mutate(c.id)}
                    aria-label={`Delete ${c.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Create */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium">Add client</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="c-name">Name</Label>
                <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My app" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-uri">Redirect URL</Label>
                <Input id="c-uri" type="url" value={redirectUri} onChange={(e) => setRedirectUri(e.target.value)} placeholder="https://app.example.com/callback" />
              </div>
            </div>
            <Button onClick={create} disabled={!name.trim() || !redirectUri.trim() || createClient.isPending}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add
            </Button>
          </div>

          {created && <CreatedClientCard client={created} onDismiss={() => setCreated(null)} />}
        </CardContent>
      </Card>
    </div>
  );
}

function CreatedClientCard({ client, onDismiss }: { client: OAuth2Client; onDismiss: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(label: string, value: string) {
    navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  }

  const rows: [string, string][] = [
    ["Client ID", client.clientId],
    ["Client secret", client.clientSecret],
  ];

  return (
    <div className="rounded-md border bg-muted/40 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Client created</p>
        <Button size="sm" variant="ghost" className="h-7" onClick={onDismiss}>Dismiss</Button>
      </div>
      <p className="text-xs text-muted-foreground">Copy the secret now — it won&apos;t be shown again.</p>
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
          <code className="flex-1 text-xs font-mono break-all">{value}</code>
          <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => copy(label, value)}>
            {copied === label ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      ))}
    </div>
  );
}

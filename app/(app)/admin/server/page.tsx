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
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Send, Clock } from "lucide-react";
import {
  useSetMailSettings,
  useSendTestMail,
  useBackgroundJobsMode,
} from "@/lib/hooks/useServerSettings";
import type { MailSmtpMode } from "@/lib/api/serverSettings";

const CRON_MODES: Record<string, string> = {
  ajax: "AJAX — runs whenever a page is loaded. Simple, but unreliable.",
  webcron:
    "Webcron — an external service calls cron.php over HTTP on a schedule.",
  cron: "Cron — the system cron runs background jobs (recommended).",
};

export default function AdminServerPage() {
  const saveMail = useSetMailSettings();
  const testMail = useSendTestMail();
  const { data: cronMode, isLoading: cronLoading } = useBackgroundJobsMode();

  // Mail values live in config.php system values — there is no clean GET, so the
  // form starts blank with placeholders.
  const [smtpMode, setSmtpMode] = useState<MailSmtpMode>("smtp");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  // Radix Select cannot use an empty-string value, so "none" is the sentinel
  // for the absence of encryption; it maps to "" in the payload.
  const [secure, setSecure] = useState<"none" | "ssl" | "tls">("none");
  const [fromAddress, setFromAddress] = useState("");
  const [domain, setDomain] = useState("");
  const [auth, setAuth] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const isSmtp = smtpMode === "smtp";

  function save() {
    saveMail.mutate({
      settings: {
        mail_domain: domain.trim(),
        mail_from_address: fromAddress.trim(),
        mail_smtpmode: smtpMode,
        mail_smtpsecure: isSmtp && secure !== "none" ? secure : "",
        mail_smtphost: isSmtp ? host.trim() : "",
        mail_smtpauth: isSmtp && auth ? 1 : 0,
        mail_smtpport: isSmtp ? port.trim() : "",
        mail_sendmailmode: "smtp",
      },
      credentials:
        isSmtp && auth
          ? { mail_smtpname: username.trim(), mail_smtppassword: password }
          : undefined,
    });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Basic settings</h1>
        <p className="text-muted-foreground text-sm">
          Configure how this server sends email and runs background jobs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            Email server
          </CardTitle>
          <CardDescription>
            Used to send notifications, password resets and share invitations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="m-from">Send emails from</Label>
              <Input
                id="m-from"
                value={fromAddress}
                onChange={(e) => setFromAddress(e.target.value)}
                placeholder="no-reply"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-domain">Mail domain</Label>
              <Input
                id="m-domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="m-mode">Send mode</Label>
            <Select
              value={smtpMode}
              onValueChange={(v) => setSmtpMode(v as MailSmtpMode)}
            >
              <SelectTrigger id="m-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="smtp">SMTP</SelectItem>
                <SelectItem value="sendmail">Sendmail</SelectItem>
                <SelectItem value="qmail">qmail</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isSmtp && (
            <>
              <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
                <div className="space-y-1.5">
                  <Label htmlFor="m-host">SMTP host</Label>
                  <Input
                    id="m-host"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="smtp.example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="m-port">Port</Label>
                  <Input
                    id="m-port"
                    inputMode="numeric"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m-secure">Encryption</Label>
                <Select
                  value={secure}
                  onValueChange={(v) =>
                    setSecure(v as "none" | "ssl" | "tls")
                  }
                >
                  <SelectTrigger id="m-secure">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None / STARTTLS</SelectItem>
                    <SelectItem value="ssl">SSL/TLS</SelectItem>
                    <SelectItem value="tls">STARTTLS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between gap-4 border-t pt-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Authentication required</p>
                  <p className="text-xs text-muted-foreground">
                    Sign in to the SMTP server before sending.
                  </p>
                </div>
                <Switch
                  checked={auth}
                  onCheckedChange={setAuth}
                  aria-label="Authentication required"
                />
              </div>

              {auth && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="m-user">SMTP username</Label>
                    <Input
                      id="m-user"
                      autoComplete="off"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="m-pass">SMTP password</Label>
                    <Input
                      id="m-pass"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex items-center gap-2 border-t pt-4">
            <Button onClick={save} disabled={saveMail.isPending}>
              {saveMail.isPending ? "Saving…" : "Save"}
            </Button>
            <Button
              variant="outline"
              onClick={() => testMail.mutate()}
              disabled={testMail.isPending}
            >
              <Send className="h-4 w-4 mr-1.5" />
              Send test email
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Background jobs
          </CardTitle>
          <CardDescription>
            How recurring maintenance tasks are executed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cronLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : cronMode ? (
            <div className="rounded-md border bg-muted/40 px-3 py-2.5">
              <p className="text-sm font-medium capitalize">{cronMode}</p>
              <p className="text-xs text-muted-foreground">
                {CRON_MODES[cronMode] ?? "Current background-jobs mode."}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              The background-jobs mode is configured on the server and cannot be
              changed here.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

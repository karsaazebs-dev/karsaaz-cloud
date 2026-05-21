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
import { HardDriveDownload, Trash2, Plus, Circle } from "lucide-react";
import {
  useUserStorages,
  useCreateUserStorage,
  useDeleteUserStorage,
} from "@/lib/hooks/useUserExternalStorage";
import type { ExternalStorageBackend } from "@/lib/api/externalStorage";
import { cn } from "@/lib/utils";

const BACKEND_LABELS: Record<string, string> = {
  dav: "WebDAV",
  smb: "SMB / CIFS",
  local: "Local",
  sftp: "SFTP",
  ftp: "FTP",
  amazons3: "Amazon S3",
  owncloud: "Nextcloud",
};

// Which fields each backend exposes. Drives rendering + payload assembly so the
// option keys stay in sync with the server backends (files_external/lib/Lib/Backend).
type Field =
  | "host"
  | "share"
  | "root"
  | "port"
  | "bucket"
  | "hostname"
  | "region"
  | "user"
  | "password"
  | "key"
  | "secret"
  | "secure"
  | "use_ssl"
  | "use_path_style"
  | "legacy_auth";

interface BackendConfig {
  authMechanism: string;
  fields: Field[];
}

// Personal mounts cannot use the "local" backend (admin-only), so it is omitted.
type UserBackend = Exclude<ExternalStorageBackend, "local">;

const BACKEND_CONFIG: Record<UserBackend, BackendConfig> = {
  dav: { authMechanism: "password::password", fields: ["host", "root", "secure", "user", "password"] },
  smb: { authMechanism: "password::password", fields: ["host", "share", "root", "user", "password"] },
  sftp: { authMechanism: "password::password", fields: ["host", "port", "root", "user", "password"] },
  ftp: { authMechanism: "password::password", fields: ["host", "root", "secure", "user", "password"] },
  owncloud: { authMechanism: "password::password", fields: ["host", "root", "secure", "user", "password"] },
  amazons3: {
    authMechanism: "amazons3::accesskey",
    fields: ["bucket", "hostname", "port", "region", "use_ssl", "use_path_style", "legacy_auth", "key", "secret"],
  },
};

const HOST_PLACEHOLDER: Partial<Record<UserBackend, string>> = {
  dav: "https://example.com/dav",
  smb: "server.local",
  sftp: "sftp.example.com",
  ftp: "ftp.example.com",
  owncloud: "https://cloud.example.com",
};

export default function PersonalExternalStoragePage() {
  const { data: storages, isLoading } = useUserStorages();
  const createStorage = useCreateUserStorage();
  const deleteStorage = useDeleteUserStorage();

  const [backend, setBackend] = useState<UserBackend>("dav");
  const [mountPoint, setMountPoint] = useState("");
  const [host, setHost] = useState("");
  const [share, setShare] = useState("");
  const [root, setRoot] = useState("");
  const [port, setPort] = useState("");
  const [bucket, setBucket] = useState("");
  const [hostname, setHostname] = useState("");
  const [region, setRegion] = useState("");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [key, setKey] = useState("");
  const [secret, setSecret] = useState("");
  const [secure, setSecure] = useState(true);
  const [useSsl, setUseSsl] = useState(true);
  const [usePathStyle, setUsePathStyle] = useState(false);
  const [legacyAuth, setLegacyAuth] = useState(false);

  const config = BACKEND_CONFIG[backend];
  const has = (f: Field) => config.fields.includes(f);

  function reset() {
    setMountPoint("");
    setHost("");
    setShare("");
    setRoot("");
    setPort("");
    setBucket("");
    setHostname("");
    setRegion("");
    setUser("");
    setPassword("");
    setKey("");
    setSecret("");
    setSecure(true);
    setUseSsl(true);
    setUsePathStyle(false);
    setLegacyAuth(false);
  }

  // The single required text field per backend (besides the mount point).
  const primaryValue = backend === "amazons3" ? bucket : host;
  const canCreate = !!mountPoint.trim() && !!primaryValue.trim();

  function create() {
    if (!canCreate) return;

    let backendOptions: Record<string, unknown>;
    switch (backend) {
      case "dav":
        backendOptions = { host, root, secure, user, password };
        break;
      case "smb":
        backendOptions = { host, share, root, domain: "", user, password };
        break;
      case "sftp":
        backendOptions = { host, port: port ? Number(port) : undefined, root, user, password };
        break;
      case "ftp":
        backendOptions = { host, root, secure, user, password };
        break;
      case "owncloud":
        backendOptions = { host, root, secure, user, password };
        break;
      case "amazons3":
        backendOptions = {
          bucket,
          hostname,
          port: port ? Number(port) : undefined,
          region,
          use_ssl: useSsl,
          use_path_style: usePathStyle,
          legacy_auth: legacyAuth,
          key,
          secret,
        };
        break;
    }

    createStorage.mutate(
      {
        mountPoint: mountPoint.trim(),
        backend,
        authMechanism: config.authMechanism,
        backendOptions,
      },
      { onSuccess: reset }
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">External storage</h1>
        <p className="text-muted-foreground text-sm">Mount your own external storage to access it within your files.</p>
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HardDriveDownload className="h-4 w-4" />
            Mounts
          </CardTitle>
          <CardDescription>External storages you have configured.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : !storages || storages.length === 0 ? (
            <p className="text-sm text-muted-foreground">You have not configured any external storage yet.</p>
          ) : (
            storages.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
                <Circle
                  className={cn(
                    "h-2.5 w-2.5 shrink-0 fill-current",
                    s.status === 0 ? "text-green-500" : "text-muted-foreground"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{s.mountPoint}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {BACKEND_LABELS[s.backend] ?? s.backend}
                    {typeof s.backendOptions?.host === "string" && ` · ${s.backendOptions.host}`}
                    {typeof s.backendOptions?.bucket === "string" && ` · ${s.backendOptions.bucket}`}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteStorage.mutate(s.id)}
                  aria-label={`Remove ${s.mountPoint}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Create */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add storage</CardTitle>
          <CardDescription>Mount an external storage backend for your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={backend} onValueChange={(v) => setBackend(v as UserBackend)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dav">WebDAV</SelectItem>
                  <SelectItem value="smb">SMB / CIFS</SelectItem>
                  <SelectItem value="sftp">SFTP</SelectItem>
                  <SelectItem value="ftp">FTP</SelectItem>
                  <SelectItem value="owncloud">Nextcloud</SelectItem>
                  <SelectItem value="amazons3">Amazon S3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="es-mount">Folder name</Label>
              <Input id="es-mount" value={mountPoint} onChange={(e) => setMountPoint(e.target.value)} placeholder="External" />
            </div>

            {has("host") && (
              <div className="space-y-1.5">
                <Label htmlFor="es-host">{backend === "dav" || backend === "owncloud" ? "URL" : "Host"}</Label>
                <Input id="es-host" value={host} onChange={(e) => setHost(e.target.value)} placeholder={HOST_PLACEHOLDER[backend]} />
              </div>
            )}

            {has("bucket") && (
              <div className="space-y-1.5">
                <Label htmlFor="es-bucket">Bucket</Label>
                <Input id="es-bucket" value={bucket} onChange={(e) => setBucket(e.target.value)} placeholder="my-bucket" />
              </div>
            )}

            {has("hostname") && (
              <div className="space-y-1.5">
                <Label htmlFor="es-hostname">Hostname</Label>
                <Input id="es-hostname" value={hostname} onChange={(e) => setHostname(e.target.value)} placeholder="s3.amazonaws.com" />
              </div>
            )}

            {has("share") && (
              <div className="space-y-1.5">
                <Label htmlFor="es-share">Share</Label>
                <Input id="es-share" value={share} onChange={(e) => setShare(e.target.value)} placeholder="share-name" />
              </div>
            )}

            {has("port") && (
              <div className="space-y-1.5">
                <Label htmlFor="es-port">Port</Label>
                <Input id="es-port" type="number" value={port} onChange={(e) => setPort(e.target.value)} placeholder={backend === "sftp" ? "22" : "443"} />
              </div>
            )}

            {has("region") && (
              <div className="space-y-1.5">
                <Label htmlFor="es-region">Region</Label>
                <Input id="es-region" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="us-east-1" />
              </div>
            )}

            {has("root") && (
              <div className="space-y-1.5">
                <Label htmlFor="es-root">Remote subfolder</Label>
                <Input id="es-root" value={root} onChange={(e) => setRoot(e.target.value)} placeholder="/" />
              </div>
            )}

            {has("user") && (
              <div className="space-y-1.5">
                <Label htmlFor="es-user">Username</Label>
                <Input id="es-user" value={user} onChange={(e) => setUser(e.target.value)} autoComplete="off" />
              </div>
            )}

            {has("password") && (
              <div className="space-y-1.5">
                <Label htmlFor="es-pass">Password</Label>
                <Input id="es-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              </div>
            )}

            {has("key") && (
              <div className="space-y-1.5">
                <Label htmlFor="es-key">Access key</Label>
                <Input id="es-key" value={key} onChange={(e) => setKey(e.target.value)} autoComplete="off" />
              </div>
            )}

            {has("secret") && (
              <div className="space-y-1.5">
                <Label htmlFor="es-secret">Secret key</Label>
                <Input id="es-secret" type="password" value={secret} onChange={(e) => setSecret(e.target.value)} autoComplete="new-password" />
              </div>
            )}
          </div>

          {has("secure") && (
            <div className="flex items-center gap-2">
              <Switch id="es-secure" checked={secure} onCheckedChange={setSecure} />
              <Label htmlFor="es-secure" className="cursor-pointer">{backend === "ftp" ? "Use FTPS" : "Use HTTPS"}</Label>
            </div>
          )}

          {has("use_ssl") && (
            <div className="flex items-center gap-2">
              <Switch id="es-use-ssl" checked={useSsl} onCheckedChange={setUseSsl} />
              <Label htmlFor="es-use-ssl" className="cursor-pointer">Enable SSL</Label>
            </div>
          )}

          {has("use_path_style") && (
            <div className="flex items-center gap-2">
              <Switch id="es-path-style" checked={usePathStyle} onCheckedChange={setUsePathStyle} />
              <Label htmlFor="es-path-style" className="cursor-pointer">Enable path style</Label>
            </div>
          )}

          {has("legacy_auth") && (
            <div className="flex items-center gap-2">
              <Switch id="es-legacy-auth" checked={legacyAuth} onCheckedChange={setLegacyAuth} />
              <Label htmlFor="es-legacy-auth" className="cursor-pointer">Legacy (v2) authentication</Label>
            </div>
          )}

          <Button onClick={create} disabled={!canCreate || createStorage.isPending}>
            <Plus className="h-4 w-4 mr-1.5" />
            {createStorage.isPending ? "Adding…" : "Add storage"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

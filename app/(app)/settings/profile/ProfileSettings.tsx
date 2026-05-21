"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useCurrentUser } from "@/lib/hooks/useDashboard";
import { useAvatarMutations } from "@/lib/hooks/useProfile";
import { updateUser } from "@/lib/api/ocs";
import type { OCSUser } from "@/lib/types/ocs.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Save,
  User,
  Phone,
  Info,
  Upload,
  Trash2,
  Eye,
  HardDrive,
  Users,
  Lock,
  Globe,
  Building,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SessionData = { basicAuth?: string; username?: string } & Record<string, unknown>;

// `OCSUser` only types a subset of the account properties. The personal-info
// page also exposes these editable properties + per-property visibility scopes
// (see Nextcloud IAccountManager::PROPERTY_*, the provisioning_api
// UsersController editable fields, and AUserData::SCOPE_SUFFIX = "Scope").
// They are read off the loaded user object without re-typing the shared API.
type ProfileUser = OCSUser & {
  fediverse?: string;
  organisation?: string;
  role?: string;
  headline?: string;
  biography?: string;
  birthdate?: string;
  pronouns?: string;
  profile_enabled?: string;
  // Scope values are "v2-private" | "v2-local" | "v2-federated" | "v2-published"
  [scopeKey: `${string}Scope`]: string | undefined;
};

// Editable account-property keys accepted by PUT /cloud/users/{id} (key/value).
// Verified against the live backend (/cloud/user/fields) and the mirror's
// UsersController::editUser permitted fields + IAccountManager::PROPERTY_*.
type FieldKey =
  | "displayname"
  | "email"
  | "phone"
  | "address"
  | "website"
  | "twitter"
  | "fediverse"
  | "organisation"
  | "role"
  | "headline"
  | "biography"
  | "birthdate"
  | "pronouns"
  | "language"
  | "locale"
  | "first_day_of_week";

type FormState = Record<FieldKey, string>;

const EMPTY_FORM: FormState = {
  displayname: "",
  email: "",
  phone: "",
  address: "",
  website: "",
  twitter: "",
  fediverse: "",
  organisation: "",
  role: "",
  headline: "",
  biography: "",
  birthdate: "",
  pronouns: "",
  language: "",
  locale: "",
  first_day_of_week: "",
};

function userToForm(user: ProfileUser): FormState {
  return {
    displayname: user.displayname ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    address: user.address ?? "",
    website: user.website ?? "",
    twitter: user.twitter ?? "",
    fediverse: user.fediverse ?? "",
    organisation: user.organisation ?? "",
    role: user.role ?? "",
    headline: user.headline ?? "",
    biography: user.biography ?? "",
    birthdate: user.birthdate ?? "",
    pronouns: user.pronouns ?? "",
    language: user.language ?? "",
    locale: user.locale ?? "",
    // first_day_of_week is not echoed by GET /cloud/user; default to "derived".
    first_day_of_week: "",
  };
}

// ── Profile visibility scopes ─────────────────────────────────────────────────
// NC sets per-property visibility via updateUser with key `{property}Scope`
// (e.g. phoneScope) and value v2-private | v2-local | v2-federated | v2-published.
// Confirmed against IAccountManager::SCOPE_* and the live /cloud/user response.

const SCOPES = [
  { value: "v2-private", label: "Private", icon: Lock, hint: "Only visible to you" },
  { value: "v2-local", label: "Local", icon: Building, hint: "Visible to people on this instance" },
  { value: "v2-federated", label: "Federated", icon: Share2, hint: "Visible to people on trusted servers" },
  { value: "v2-published", label: "Published", icon: Globe, hint: "Visible to everyone, incl. lookup server" },
] as const;

type ScopeValue = (typeof SCOPES)[number]["value"];

// Properties that expose a visibility scope on the personal-info page, mapped to
// their `{property}Scope` key. Verified writable on the live backend.
const SCOPE_FIELDS: { property: string; label: string }[] = [
  { property: "displayname", label: "Full name" },
  { property: "email", label: "Email" },
  { property: "phone", label: "Phone number" },
  { property: "address", label: "Location" },
  { property: "website", label: "Website" },
  { property: "twitter", label: "X (formerly Twitter)" },
  { property: "fediverse", label: "Fediverse" },
  { property: "organisation", label: "Organisation" },
  { property: "role", label: "Role" },
  { property: "headline", label: "Headline" },
  { property: "biography", label: "About" },
  { property: "pronouns", label: "Pronouns" },
  { property: "birthdate", label: "Date of birth" },
  { property: "avatar", label: "Profile picture" },
];

const WEEKDAYS = [
  { value: "-1", label: "Derived from region" },
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

function formatBytes(bytes: number): string {
  if (bytes < 0) return "—";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function ProfileSettings() {
  const { data: session } = useSession();
  const basicAuth = (session as SessionData | null)?.basicAuth as string | undefined;
  const username = (session as SessionData | null)?.username as string | undefined;

  const { data: user, isLoading } = useCurrentUser();
  const qc = useQueryClient();
  const { upload: avatarUpload, remove: avatarRemove } = useAvatarMutations();
  const fileInput = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [initial, setInitial] = useState<FormState>(EMPTY_FORM);

  // Profile enabled toggle (key `profile_enabled`, value 'true'/'false';
  // the API stores/returns it as '1'/'0' or 'true'/'false').
  const [profileEnabled, setProfileEnabled] = useState(true);
  const [initialProfileEnabled, setInitialProfileEnabled] = useState(true);

  // Per-property visibility scopes.
  const [scopes, setScopes] = useState<Record<string, ScopeValue>>({});
  const [initialScopes, setInitialScopes] = useState<Record<string, ScopeValue>>({});

  // Cache-buster so the avatar <img> refreshes after upload/remove.
  const [avatarVersion, setAvatarVersion] = useState(0);

  // Populate the form whenever a (new) user is loaded.
  useEffect(() => {
    if (!user) return;
    const u = user as ProfileUser;
    const next = userToForm(u);
    setForm(next);
    setInitial(next);

    const enabled =
      u.profile_enabled === undefined
        ? true
        : u.profile_enabled === "1" || u.profile_enabled === "true";
    setProfileEnabled(enabled);
    setInitialProfileEnabled(enabled);

    const loadedScopes: Record<string, ScopeValue> = {};
    for (const { property } of SCOPE_FIELDS) {
      const raw = u[`${property}Scope`];
      if (typeof raw === "string" && SCOPES.some((s) => s.value === raw)) {
        loadedScopes[property] = raw as ScopeValue;
      }
    }
    setScopes(loadedScopes);
    setInitialScopes(loadedScopes);
    setAvatarVersion((v) => v + 1);
  }, [user]);

  const set = (key: FieldKey) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setScope = (property: string) => (value: string) =>
    setScopes((prev) => ({ ...prev, [property]: value as ScopeValue }));

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      if (!basicAuth || !username) return;
      const opts = { basicAuth };

      // 1. Only push the text/select fields the user actually changed.
      const changedFields = (Object.keys(form) as FieldKey[]).filter(
        (key) => form[key] !== initial[key]
      );
      // 2. profile_enabled toggle.
      const profileChanged = profileEnabled !== initialProfileEnabled;
      // 3. Changed visibility scopes.
      const changedScopes = SCOPE_FIELDS.map((f) => f.property).filter(
        (property) => scopes[property] && scopes[property] !== initialScopes[property]
      );

      await Promise.all([
        ...changedFields.map((key) => updateUser(opts, username, key, form[key])),
        ...(profileChanged
          ? [updateUser(opts, username, "profile_enabled", profileEnabled ? "true" : "false")]
          : []),
        ...changedScopes.map((property) =>
          updateUser(opts, username, `${property}Scope`, scopes[property])
        ),
      ]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currentUser"] });
      setInitial(form);
      setInitialProfileEnabled(profileEnabled);
      setInitialScopes(scopes);
      toast.success("Profile updated");
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const fieldsDirty = (Object.keys(form) as FieldKey[]).some(
    (key) => form[key] !== initial[key]
  );
  const scopesDirty = SCOPE_FIELDS.some(
    (f) => scopes[f.property] && scopes[f.property] !== initialScopes[f.property]
  );
  const dirty =
    fieldsDirty || scopesDirty || profileEnabled !== initialProfileEnabled;

  const avatarUrl = useMemo(
    () =>
      username
        ? `/api/proxy/index.php/avatar/${encodeURIComponent(username)}/512?v=${avatarVersion}`
        : undefined,
    [username, avatarVersion]
  );

  const initials = (form.displayname || username || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      toast.error("Please choose a PNG or JPEG image");
      return;
    }
    avatarUpload.mutate(file, {
      onSuccess: (result) => {
        if (result.status === "success") setAvatarVersion((v) => v + 1);
      },
    });
  };

  const quota = (user as ProfileUser | undefined)?.quota;
  const groups = (user as ProfileUser | undefined)?.groups ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-9 w-32" />
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Profile</h2>
        <p className="text-sm text-muted-foreground">Manage your personal information</p>
      </div>

      {/* Avatar */}
      <div className="flex flex-wrap items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={avatarUrl} alt={form.displayname} />
          <AvatarFallback className="text-xl bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <p className="text-sm font-medium">{username}</p>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={onPickFile}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={avatarUpload.isPending}
              onClick={() => fileInput.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {avatarUpload.isPending ? "Uploading…" : "Upload picture"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={avatarRemove.isPending}
              onClick={() =>
                avatarRemove.mutate(undefined, {
                  onSuccess: () => setAvatarVersion((v) => v + 1),
                })
              }
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            PNG or JPEG, square images work best.
          </p>
        </div>
      </div>

      {/* Enable profile */}
      <Card>
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Eye className="h-4 w-4" />
              Enable profile
            </div>
            <p className="text-sm text-muted-foreground">
              Allow others to see your public profile page.
            </p>
          </div>
          <Switch
            checked={profileEnabled}
            onCheckedChange={setProfileEnabled}
            aria-label="Enable profile"
          />
        </CardContent>
      </Card>

      {/* Personal info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Personal info
          </CardTitle>
          <CardDescription>
            Your name and how the system localises dates and text for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            id="displayname"
            label="Display name"
            value={form.displayname}
            onChange={set("displayname")}
            placeholder="Your full name"
          />
          <Field
            id="pronouns"
            label="Pronouns"
            value={form.pronouns}
            onChange={set("pronouns")}
            placeholder="She/her, he/him, they/them …"
          />
          <Field
            id="organisation"
            label="Organisation"
            value={form.organisation}
            onChange={set("organisation")}
            placeholder="Company or team"
          />
          <Field
            id="role"
            label="Role"
            value={form.role}
            onChange={set("role")}
            placeholder="Your position"
          />
          <Field
            id="headline"
            label="Headline"
            value={form.headline}
            onChange={set("headline")}
            placeholder="A short tagline"
          />
          <Field
            id="birthdate"
            label="Date of birth"
            type="date"
            value={form.birthdate}
            onChange={set("birthdate")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_day_of_week">First day of week</Label>
              <Select
                value={form.first_day_of_week || "-1"}
                onValueChange={set("first_day_of_week")}
              >
                <SelectTrigger id="first_day_of_week">
                  <SelectValue placeholder="Derived from region" />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAYS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="language"
              label="Language"
              value={form.language}
              onChange={set("language")}
              placeholder="en"
            />
            <Field
              id="locale"
              label="Locale"
              value={form.locale}
              onChange={set("locale")}
              placeholder="en_US"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-4 w-4" />
            Contact
          </CardTitle>
          <CardDescription>How people can reach or find you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            id="email"
            label="Email"
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="you@example.com"
          />
          <Field
            id="phone"
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={set("phone")}
            placeholder="+92 300 0000000"
          />
          <Field
            id="address"
            label="Address"
            value={form.address}
            onChange={set("address")}
            placeholder="City, Country"
          />
          <Field
            id="website"
            label="Website"
            type="url"
            value={form.website}
            onChange={set("website")}
            placeholder="https://example.com"
          />
          <Field
            id="twitter"
            label="X (Twitter)"
            value={form.twitter}
            onChange={set("twitter")}
            placeholder="@handle"
          />
          <Field
            id="fediverse"
            label="Fediverse"
            value={form.fediverse}
            onChange={set("fediverse")}
            placeholder="@handle@instance.social"
          />
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4" />
            About
          </CardTitle>
          <CardDescription>A short description shown on your profile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="biography">Biography</Label>
            <textarea
              id="biography"
              value={form.biography}
              onChange={(e) => set("biography")(e.target.value)}
              placeholder="Tell others a little about yourself"
              rows={4}
              className={cn(
                "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Profile visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="h-4 w-4" />
            Profile visibility
          </CardTitle>
          <CardDescription>
            Choose who can see each piece of your account information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {SCOPE_FIELDS.map(({ property, label }) => {
            const current = scopes[property];
            // Only render properties whose scope the backend actually reports.
            if (!current) return null;
            return (
              <div
                key={property}
                className="flex items-center justify-between gap-4 border-b border-border/50 pb-3 last:border-0 last:pb-0"
              >
                <span className="text-sm">{label}</span>
                <Select value={current} onValueChange={setScope(property)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCOPES.map((s) => {
                      const Icon = s.icon;
                      return (
                        <SelectItem key={s.value} value={s.value}>
                          <span className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5" />
                            {s.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4" />
            Details
          </CardTitle>
          <CardDescription>Your group memberships and storage usage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4" />
              Groups
            </div>
            {groups.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {groups.map((g) => (
                  <span
                    key={g}
                    className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {g}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No groups</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <HardDrive className="h-4 w-4" />
              Storage
            </div>
            {quota ? (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {formatBytes(quota.used)} used
                  {quota.total >= 0 ? ` of ${formatBytes(quota.total)}` : " (unlimited)"}
                </p>
                {quota.total >= 0 && (
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, quota.relative))}%` }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Unavailable</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => save()} disabled={isPending || !dirty} className="gap-2">
        <Save className="h-4 w-4" />
        {isPending ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

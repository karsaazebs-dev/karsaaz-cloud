"use client";

import { useEffect, useMemo, useState } from "react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Server, Plus, Trash2, Save } from "lucide-react";
import {
  useLdapConfigs,
  useCreateLdapConfig,
  useModifyLdapConfig,
  useDeleteLdapConfig,
} from "@/lib/hooks/useLdap";
import type { LdapConfig, LdapConfigInput } from "@/lib/api/ldap";

// Field descriptors for the wizard. Keys match the user_ldap
// Configuration.php properties exactly. `type` controls the editor:
//   text     -> text Input
//   password -> password Input
//   number   -> numeric Input
//   switch   -> 0/1 Switch
type FieldType = "text" | "password" | "number" | "switch";

interface LdapField {
  key: keyof LdapConfigInput;
  label: string;
  type: FieldType;
  placeholder?: string;
}

// Tabs mirror the Nextcloud user_ldap wizard.
const TABS: { value: string; label: string; fields: LdapField[] }[] = [
  {
    value: "server",
    label: "Server",
    fields: [
      { key: "ldapHost", label: "Host", type: "text", placeholder: "ldaps://ldap.example.com" },
      { key: "ldapPort", label: "Port", type: "number", placeholder: "636" },
      { key: "ldapBase", label: "Base DN", type: "text", placeholder: "dc=example,dc=com" },
      { key: "ldapAgentName", label: "Bind DN (user)", type: "text", placeholder: "cn=admin,dc=example,dc=com" },
      { key: "ldapAgentPassword", label: "Bind password", type: "password" },
    ],
  },
  {
    value: "users",
    label: "Users",
    fields: [
      { key: "ldapBaseUsers", label: "Base DN for users", type: "text" },
      { key: "ldapUserFilter", label: "User filter", type: "text" },
      { key: "ldapUserFilterObjectclass", label: "User object classes", type: "text", placeholder: "inetOrgPerson" },
      { key: "ldapUserFilterGroups", label: "Restrict to groups", type: "text" },
      { key: "ldapUserDisplayName", label: "Display name attribute", type: "text", placeholder: "displayName" },
    ],
  },
  {
    value: "login",
    label: "Login Attributes",
    fields: [
      { key: "ldapLoginFilter", label: "Login filter", type: "text" },
      { key: "ldapLoginFilterUsername", label: "Allow login with username", type: "switch" },
      { key: "ldapLoginFilterEmail", label: "Allow login with email", type: "switch" },
      { key: "ldapLoginFilterAttributes", label: "Other login attributes", type: "text" },
    ],
  },
  {
    value: "groups",
    label: "Groups",
    fields: [
      { key: "ldapBaseGroups", label: "Base DN for groups", type: "text" },
      { key: "ldapGroupFilter", label: "Group filter", type: "text" },
      { key: "ldapGroupFilterObjectclass", label: "Group object classes", type: "text", placeholder: "groupOfNames" },
      { key: "ldapGroupDisplayName", label: "Group display name attribute", type: "text", placeholder: "cn" },
      { key: "ldapGroupMemberAssocAttr", label: "Group-member association", type: "text", placeholder: "member" },
    ],
  },
  {
    value: "advanced",
    label: "Advanced",
    fields: [
      { key: "ldapTLS", label: "Use StartTLS", type: "switch" },
      { key: "turnOffCertCheck", label: "Turn off SSL certificate validation", type: "switch" },
      { key: "ldapCacheTTL", label: "Cache time-to-live (seconds)", type: "number", placeholder: "600" },
      { key: "ldapPagingSize", label: "Paging chunk size", type: "number", placeholder: "500" },
      { key: "ldapExpertUsernameAttr", label: "Internal username attribute", type: "text" },
      { key: "ldapExpertUUIDUserAttr", label: "UUID attribute for users", type: "text" },
      { key: "ldapQuotaAttribute", label: "Quota attribute", type: "text" },
      { key: "ldapEmailAttribute", label: "Email attribute", type: "text" },
      { key: "ldapUserAvatarRule", label: "User profile picture rule", type: "text", placeholder: "default" },
    ],
  },
];

// Every editable field across all tabs, used to build/serialise form state.
const ALL_FIELDS: LdapField[] = TABS.flatMap((t) => t.fields);

type FormState = Record<string, string>;

function toForm(config: LdapConfig): FormState {
  const form: FormState = {};
  for (const { key } of ALL_FIELDS) {
    const raw = config.config[key as string];
    // Multi-line fields come back as arrays from the backend; flatten them.
    form[key as string] = Array.isArray(raw) ? (raw as string[]).join("\n") : raw ?? "";
  }
  return form;
}

export default function AdminLdapPage() {
  const { data: configs, isLoading } = useLdapConfigs();
  const createConfig = useCreateLdapConfig();
  const modifyConfig = useModifyLdapConfig();
  const deleteConfig = useDeleteLdapConfig();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({});
  const [active, setActive] = useState(false);

  // Keep a valid selection as the list loads / changes.
  useEffect(() => {
    if (!configs || configs.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !configs.some((c) => c.id === selectedId)) {
      setSelectedId(configs[0].id);
    }
  }, [configs, selectedId]);

  const selected = useMemo(
    () => configs?.find((c) => c.id === selectedId) ?? null,
    [configs, selectedId]
  );

  // Sync the form when the selected config changes.
  useEffect(() => {
    if (selected) {
      setForm(toForm(selected));
      setActive(selected.config.ldapConfigurationActive === "1");
    } else {
      setForm({});
      setActive(false);
    }
  }, [selected]);

  function setField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function save() {
    if (!selectedId) return;
    const configData: LdapConfigInput = {
      ...(form as LdapConfigInput),
      ldapConfigurationActive: active ? "1" : "0",
    };
    modifyConfig.mutate({ id: selectedId, configData });
  }

  function add() {
    createConfig.mutate(undefined, {
      onSuccess: (id) => setSelectedId(id),
    });
  }

  function remove() {
    if (!selectedId) return;
    deleteConfig.mutate(selectedId, {
      onSuccess: () => setSelectedId(null),
    });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">LDAP / AD integration</h1>
        <p className="text-muted-foreground text-sm">
          Connect Karsaaz Cloud to an LDAP or Active Directory server for user and group authentication.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[14rem_1fr]">
        {/* Configuration list */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="h-4 w-4" />
              Configurations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <Skeleton className="h-9 w-full" />
            ) : !configs || configs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No configurations yet.</p>
            ) : (
              configs.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    c.id === selectedId
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <p className="font-medium truncate">
                    {i + 1}. {c.config.ldapHost || "New server"}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">{c.id}</p>
                </button>
              ))
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={add}
              disabled={createConfig.isPending}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add configuration
            </Button>
          </CardContent>
        </Card>

        {/* Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {selected ? `Server settings (${selected.id})` : "Server settings"}
            </CardTitle>
            <CardDescription>
              Full LDAP wizard configuration. Changes take effect after saving.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : !selected ? (
              <p className="text-sm text-muted-foreground">
                No LDAP configuration is set up. Click &ldquo;Add configuration&rdquo; to create one.
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">Configuration active</p>
                    <p className="text-xs text-muted-foreground">
                      Enable this server for authentication.
                    </p>
                  </div>
                  <Switch
                    checked={active}
                    onCheckedChange={setActive}
                    aria-label="Configuration active"
                  />
                </div>

                <Tabs defaultValue="server">
                  <TabsList className="flex w-full flex-wrap h-auto">
                    {TABS.map((t) => (
                      <TabsTrigger key={t.value} value={t.value}>
                        {t.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {TABS.map((tab) => (
                    <TabsContent key={tab.value} value={tab.value} className="mt-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {tab.fields.map((field) => {
                          const id = `ldap-${field.key}`;
                          if (field.type === "switch") {
                            return (
                              <div
                                key={field.key}
                                className="flex items-center justify-between gap-4 rounded-md border px-3 py-2 sm:col-span-2"
                              >
                                <Label htmlFor={id}>{field.label}</Label>
                                <Switch
                                  id={id}
                                  checked={form[field.key] === "1"}
                                  onCheckedChange={(checked) =>
                                    setField(field.key, checked ? "1" : "0")
                                  }
                                  aria-label={field.label}
                                />
                              </div>
                            );
                          }
                          return (
                            <div key={field.key} className="space-y-1.5">
                              <Label htmlFor={id}>{field.label}</Label>
                              <Input
                                id={id}
                                type={
                                  field.type === "password"
                                    ? "password"
                                    : field.type === "number"
                                      ? "number"
                                      : "text"
                                }
                                value={form[field.key] ?? ""}
                                placeholder={field.placeholder}
                                onChange={(e) => setField(field.key, e.target.value)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                <div className="flex items-center gap-2 border-t pt-4">
                  <Button onClick={save} disabled={modifyConfig.isPending}>
                    <Save className="h-4 w-4 mr-1.5" />
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={remove}
                    disabled={deleteConfig.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Delete
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

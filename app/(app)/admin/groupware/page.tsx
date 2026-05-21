"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAppConfigValues, useSetAppConfigValue } from "@/lib/hooks/useAppConfig";

// Groupware (calendar) defaults are stored under the `dav` app as "yes"/"no".
const APP = "dav";

interface ToggleDef {
  key: string;
  label: string;
  description: string;
  defaultOn: boolean;
}

const TOGGLES: ToggleDef[] = [
  { key: "sendInvitations", label: "Send invitations to attendees", description: "Email calendar invitations when events are created.", defaultOn: true },
  { key: "generateBirthdayCalendar", label: "Generate birthday calendar", description: "Create a calendar from contacts' birthdays.", defaultOn: true },
  { key: "sendEventReminders", label: "Send event reminders", description: "Email reminders before events start.", defaultOn: true },
  { key: "sendEventRemindersToSharedUsers", label: "Send reminders to shared users", description: "Also notify users an event's calendar is shared with.", defaultOn: true },
  { key: "sendEventRemindersPush", label: "Event reminders via push", description: "Deliver event reminders as push notifications.", defaultOn: true },
];

const KEYS = TOGGLES.map((t) => t.key);

export default function AdminGroupwarePage() {
  const { data: values, isLoading } = useAppConfigValues(APP, KEYS);
  const setValue = useSetAppConfigValue(APP);

  function isOn(def: ToggleDef): boolean {
    const v = values?.[def.key];
    if (v === undefined || v === "") return def.defaultOn;
    return v === "yes";
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Groupware</h1>
        <p className="text-muted-foreground text-sm">Calendar, contacts and scheduling defaults.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Calendar server settings</CardTitle>
          <CardDescription>Apply instance-wide. Changes take effect immediately.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-5 w-9 rounded-full" />
                </div>
              ))
            : TOGGLES.map((def) => (
                <div key={def.key} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{def.label}</p>
                    <p className="text-xs text-muted-foreground">{def.description}</p>
                  </div>
                  <Switch
                    checked={isOn(def)}
                    onCheckedChange={(checked) =>
                      setValue.mutate(
                        { key: def.key, value: checked ? "yes" : "no" },
                        { onSuccess: () => toast.success("Saved") }
                      )
                    }
                    aria-label={def.label}
                  />
                </div>
              ))}
        </CardContent>
      </Card>
    </div>
  );
}

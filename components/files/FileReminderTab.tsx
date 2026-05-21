"use client";

import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { format } from "date-fns";
import {
  useReminder,
  useSetReminder,
  useRemoveReminder,
  REMINDER_PRESETS,
} from "@/lib/hooks/useFileExtras";

export function ReminderTab({ fileId }: { fileId: number }) {
  const { data: dueDate, isLoading } = useReminder(fileId || null);
  const setReminder = useSetReminder(fileId);
  const removeReminder = useRemoveReminder(fileId);

  const due = dueDate ? new Date(dueDate) : null;

  return (
    <div className="p-4 space-y-4">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading reminder…</p>
      ) : due ? (
        <div className="rounded-md border bg-primary/5 p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Bell className="h-4 w-4" />
            Reminder set
          </div>
          <p className="text-sm text-muted-foreground">
            {format(due, "PPPp")}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => removeReminder.mutate()}
            disabled={removeReminder.isPending}
          >
            <BellOff className="h-4 w-4 mr-2" />
            Clear reminder
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Set a reminder to get a notification about this file.
        </p>
      )}

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Remind me
        </p>
        {REMINDER_PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => setReminder.mutate(preset.iso())}
            disabled={setReminder.isPending}
            className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
          >
            <span>{preset.label}</span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(preset.iso()), "EEE, MMM d, HH:mm")}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

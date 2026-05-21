"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarClock, Save, Trash2 } from "lucide-react";
import {
  useOutOfOffice,
  useSetOutOfOffice,
  useClearOutOfOffice,
} from "@/lib/hooks/useAvailability";

export function AvailabilitySettings() {
  const { data: absence, isLoading } = useOutOfOffice();
  const save = useSetOutOfOffice();
  const clear = useClearOutOfOffice();

  const [firstDay, setFirstDay] = useState("");
  const [lastDay, setLastDay] = useState("");
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [replacementUserId, setReplacementUserId] = useState("");

  // Seed fields from the loaded absence data.
  useEffect(() => {
    setFirstDay(absence?.firstDay ?? "");
    setLastDay(absence?.lastDay ?? "");
    setStatus(absence?.status ?? "");
    setMessage(absence?.message ?? "");
    setReplacementUserId(absence?.replacementUserId ?? "");
  }, [absence]);

  function handleSave() {
    save.mutate({
      firstDay,
      lastDay,
      status,
      message,
      replacementUserId: replacementUserId.trim() || undefined,
    });
  }

  function handleClear() {
    clear.mutate(undefined, {
      onSuccess: () => {
        setFirstDay("");
        setLastDay("");
        setStatus("");
        setMessage("");
        setReplacementUserId("");
      },
    });
  }

  const datesInvalid =
    !!firstDay && !!lastDay && firstDay > lastDay;
  const canSave = !!firstDay && !!lastDay && !datesInvalid;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Availability</h2>
        <p className="text-sm text-muted-foreground">
          Set an absence period to inform others when you are out of office
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-4 w-4" />
            Absence period
          </CardTitle>
          <CardDescription>
            During this period your replacement and absence message are shown to
            others.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstDay">First day</Label>
                  <Input
                    id="firstDay"
                    type="date"
                    value={firstDay}
                    onChange={(e) => setFirstDay(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastDay">Last day</Label>
                  <Input
                    id="lastDay"
                    type="date"
                    value={lastDay}
                    onChange={(e) => setLastDay(e.target.value)}
                  />
                </div>
              </div>
              {datesInvalid && (
                <p className="text-xs text-destructive">
                  The first day must be before the last day.
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="status">Short absence status</Label>
                <Input
                  id="status"
                  type="text"
                  maxLength={100}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  placeholder="e.g. On vacation"
                />
                <p className="text-xs text-muted-foreground">
                  {status.length}/100
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Long absence message</Label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="I am out of office and will reply when I am back."
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="replacement">Replacement (username)</Label>
                <Input
                  id="replacement"
                  type="text"
                  value={replacementUserId}
                  onChange={(e) => setReplacementUserId(e.target.value)}
                  placeholder="Optional"
                />
                {absence?.replacementUserDisplayName && (
                  <p className="text-xs text-muted-foreground">
                    Current replacement: {absence.replacementUserDisplayName}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={save.isPending || !canSave}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {save.isPending ? "Saving…" : "Save"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClear}
                  disabled={clear.isPending}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {clear.isPending ? "Clearing…" : "Clear"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

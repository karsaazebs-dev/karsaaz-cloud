"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  useUserStatus,
  usePredefinedStatuses,
  useSetStatusType,
  useSetCustomMessage,
  useSetPredefinedMessage,
  useClearMessage,
  resolveClearAt,
  CLEAR_AT_OPTIONS,
  STATUS_META,
} from "@/lib/hooks/useUserStatus";
import type { UserStatusType } from "@/lib/types/ocs.types";

const STATUS_TYPES: UserStatusType[] = ["online", "away", "dnd", "invisible"];

export function UserStatusDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: status } = useUserStatus();
  const { data: predefined = [] } = usePredefinedStatuses();

  const setType = useSetStatusType();
  const setCustom = useSetCustomMessage();
  const setPredef = useSetPredefinedMessage();
  const clearMsg = useClearMessage();

  const [icon, setIcon] = useState("😀");
  const [message, setMessage] = useState("");
  const [clearAtIdx, setClearAtIdx] = useState("0");

  // Seed the editor from the current status whenever the dialog opens.
  useEffect(() => {
    if (open && status) {
      setIcon(status.icon || "😀");
      setMessage(status.message ?? "");
    }
  }, [open, status]);

  const currentType = status?.status ?? "offline";

  const clearAtLabel = useMemo(() => {
    if (!status?.clearAt) return null;
    return new Date(status.clearAt * 1000).toLocaleString();
  }, [status?.clearAt]);

  const handleSave = () => {
    const opt = CLEAR_AT_OPTIONS[Number(clearAtIdx)] ?? CLEAR_AT_OPTIONS[0];
    setCustom.mutate(
      { statusIcon: icon || null, message: message || null, clearAt: opt.value() },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set status</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Online status */}
          <div>
            <p className="text-sm font-medium mb-2">Online status</p>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setType.mutate(t)}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                    currentType === t
                      ? "border-primary bg-primary/5 font-medium"
                      : "hover:bg-accent"
                  )}
                >
                  <span className={cn("h-2.5 w-2.5 rounded-full", STATUS_META[t].dotClass)} />
                  {STATUS_META[t].label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom status message */}
          <div>
            <p className="text-sm font-medium mb-2">Status message</p>
            <div className="flex gap-2">
              <Input
                value={icon}
                onChange={(e) => setIcon(e.target.value.slice(0, 4))}
                className="w-12 text-center text-lg shrink-0"
                aria-label="Status emoji"
                maxLength={4}
              />
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's your status?"
                maxLength={80}
              />
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Clear after</span>
              <Select value={clearAtIdx} onValueChange={setClearAtIdx}>
                <SelectTrigger className="h-8 flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLEAR_AT_OPTIONS.map((o, i) => (
                    <SelectItem key={o.label} value={String(i)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {clearAtLabel && (
              <p className="mt-2 text-xs text-muted-foreground">
                Current status clears at {clearAtLabel}
              </p>
            )}
          </div>

          {/* Predefined statuses */}
          {predefined.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-md border divide-y">
              {predefined.map((p) => (
                <button
                  key={p.id}
                  onClick={() =>
                    setPredef.mutate(
                      { status: p, clearAt: resolveClearAt(p.clearAt) },
                      { onSuccess: () => onOpenChange(false) }
                    )
                  }
                  className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent text-left"
                >
                  <span className="text-base">{p.icon}</span>
                  <span className="flex-1 truncate">{p.message}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => clearMsg.mutate(undefined, { onSuccess: () => onOpenChange(false) })}
            disabled={clearMsg.isPending}
          >
            Clear status
          </Button>
          <Button onClick={handleSave} disabled={setCustom.isPending}>
            Set status message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

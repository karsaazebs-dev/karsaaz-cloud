"use client";

import { useState } from "react";
import { Bell, X, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications, useDismissNotification } from "@/lib/hooks/useActivity";
import { formatFileDate } from "@/lib/utils/files";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: notifications, isLoading } = useNotifications();
  const { mutate: dismiss } = useDismissNotification();

  const count = notifications?.length ?? 0;
  const displayCount = count > 0 ? count : 2;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative w-10 h-10 rounded-full bg-white border border-slate-200/60 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors focus:outline-none shadow-sm">
          <Bell className="h-[18px] w-[18px] text-slate-500" />
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#A855F7] text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-white">
            {displayCount > 9 ? "9+" : displayCount}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1 h-7"
              onClick={() => notifications?.forEach((n) => dismiss(n.notification_id))}
            >
              <CheckCheck className="h-3 w-3" />
              Clear all
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2.5 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : !notifications?.length ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
              <Bell className="h-8 w-8 mb-2 opacity-20" />
              <p>No notifications</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.notification_id}
                className="flex items-start gap-3 px-4 py-3 hover:bg-accent/50 transition-colors border-b border-border/40 last:border-0"
              >
                {n.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={n.icon} alt="" className="h-8 w-8 rounded-full" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bell className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug">{n.subject}</p>
                  {n.message && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatFileDate(n.datetime)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 -mt-1 text-muted-foreground hover:text-foreground"
                  onClick={() => dismiss(n.notification_id)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

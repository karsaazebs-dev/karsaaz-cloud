"use client";

import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut, User, Menu, Search, Smile } from "lucide-react";
import { useUIStore } from "@/lib/stores/ui.store";
import Link from "next/link";
import { useState } from "react";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { SearchModal, useSearchModal } from "@/components/layout/SearchModal";
import { UserStatusDialog } from "@/components/layout/UserStatusDialog";
import { useUserStatus, STATUS_META } from "@/lib/hooks/useUserStatus";
import { cn } from "@/lib/utils";

export function Header() {
  const { data: session } = useSession();
  const { toggleSidebar } = useUIStore();
  const { open: searchOpen, setOpen: setSearchOpen, onClose: closeSearch } = useSearchModal();
  const [statusOpen, setStatusOpen] = useState(false);
  const { data: userStatus } = useUserStatus();

  const username = (session as Record<string, unknown> | null)?.username as string | undefined;
  const displayName = session?.user?.name ?? username ?? "User";
  const email = session?.user?.email ?? "";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const avatarUrl = username
    ? `/api/proxy/index.php/avatar/${encodeURIComponent(username)}/32`
    : undefined;

  const statusDot = userStatus
    ? STATUS_META[userStatus.status]?.dotClass
    : undefined;

  return (
    <>
      <SearchModal open={searchOpen} onClose={closeSearch} />
      <UserStatusDialog open={statusOpen} onOpenChange={setStatusOpen} />
      <header className="flex items-center h-16 px-4 border-b bg-background gap-4 shrink-0">
        {/* Mobile sidebar toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search trigger */}
        <div className="flex-1 max-w-xl">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 pl-3 pr-4 h-9 rounded-md border border-input bg-muted/30 text-sm text-muted-foreground hover:bg-muted/60 transition-colors text-left"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="flex-1">Search files, folders…</span>
            <kbd className="hidden sm:inline-flex h-5 items-center rounded border px-1.5 text-[10px] font-mono">
              Ctrl+K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Notifications */}
          <NotificationBell />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="relative flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="User menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {statusDot && (
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-background",
                      statusDot
                    )}
                    aria-hidden
                  />
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={(e) => {
                  e.preventDefault();
                  setStatusOpen(true);
                }}
              >
                <Smile className="mr-2 h-4 w-4" />
                {userStatus?.message ? (
                  <span className="truncate">
                    {userStatus.icon} {userStatus.message}
                  </span>
                ) : (
                  "Set status"
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/security" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}

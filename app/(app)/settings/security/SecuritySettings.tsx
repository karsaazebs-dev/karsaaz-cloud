"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { updateUser } from "@/lib/api/ocs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Key, Save, AlertTriangle } from "lucide-react";
import { DevicesAndSessions } from "@/components/settings/DevicesAndSessions";
import { TwoFactorSettings } from "@/components/settings/TwoFactorSettings";

type SessionData = { basicAuth?: string; username?: string } & Record<string, unknown>;

export function SecuritySettings() {
  const { data: session } = useSession();
  const basicAuth = (session as SessionData | null)?.basicAuth as string | undefined;
  const username = (session as SessionData | null)?.username as string | undefined;

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const { mutate: changePassword, isPending } = useMutation({
    mutationFn: async () => {
      if (!basicAuth || !username) throw new Error("Not authenticated");
      if (newPw !== confirmPw) throw new Error("Passwords do not match");
      if (newPw.length < 8) throw new Error("Password must be at least 8 characters");
      await updateUser({ basicAuth }, username, "password", newPw);
    },
    onSuccess: () => {
      toast.success("Password changed successfully");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    },
    onError: (err: Error) =>
      toast.error(err.message || "Failed to change password"),
  });

  const strengthScore =
    newPw.length >= 12 ? 3 : newPw.length >= 8 ? (newPw.match(/[^a-zA-Z0-9]/) ? 2 : 1) : 0;

  const strengthLabels = ["Too short", "Weak", "Fair", "Strong"];
  const strengthColors = [
    "bg-destructive",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Security</h2>
        <p className="text-sm text-muted-foreground">Manage your account security</p>
      </div>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4" />
            Change Password
          </CardTitle>
          <CardDescription>
            Choose a strong password with at least 8 characters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newpw">New Password</Label>
            <Input
              id="newpw"
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="New password"
              autoComplete="new-password"
            />
            {newPw && (
              <div className="flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full ${
                        i <= strengthScore ? strengthColors[strengthScore] : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {strengthLabels[strengthScore]}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmpw">Confirm New Password</Label>
            <Input
              id="confirmpw"
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Repeat new password"
              autoComplete="new-password"
            />
            {confirmPw && newPw !== confirmPw && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Passwords don&apos;t match
              </p>
            )}
          </div>

          <Button
            onClick={() => changePassword()}
            disabled={isPending || !newPw || newPw !== confirmPw}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isPending ? "Saving…" : "Change password"}
          </Button>
        </CardContent>
      </Card>

      {/* Two-factor backup codes */}
      <TwoFactorSettings />

      {/* Devices & sessions */}
      <DevicesAndSessions />
    </div>
  );
}

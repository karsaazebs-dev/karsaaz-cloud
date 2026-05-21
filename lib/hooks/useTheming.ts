"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  updateThemingSetting,
  undoThemingSetting,
  uploadThemingImage,
  type ThemingSetting,
  type ThemingImageKey,
} from "@/lib/api/theming";
import { toast } from "sonner";

type SessionData = { basicAuth?: string } & Record<string, unknown>;

function useBasicAuth() {
  const { data: session } = useSession();
  return (session as SessionData | null)?.basicAuth as string | undefined;
}

function invalidateTheming(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["appconfig", "theming"] });
}

export function useUpdateThemingSetting() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ setting, value }: { setting: ThemingSetting; value: string }) =>
      updateThemingSetting({ basicAuth: basicAuth! }, setting, value),
    onSuccess: () => invalidateTheming(qc),
    onError: () => toast.error("Could not save theme setting"),
  });
}

export function useUploadThemingImage() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, file }: { key: ThemingImageKey; file: File }) =>
      uploadThemingImage({ basicAuth: basicAuth! }, key, file),
    onSuccess: () => {
      invalidateTheming(qc);
      toast.success("Image uploaded");
    },
    onError: () => toast.error("Could not upload image"),
  });
}

export function useUndoThemingSetting() {
  const basicAuth = useBasicAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (setting: ThemingSetting | ThemingImageKey) =>
      undoThemingSetting({ basicAuth: basicAuth! }, setting),
    onSuccess: () => {
      invalidateTheming(qc);
      toast.success("Reset to default");
    },
    onError: () => toast.error("Could not reset"),
  });
}

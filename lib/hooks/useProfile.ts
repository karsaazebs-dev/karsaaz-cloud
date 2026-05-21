"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { uploadAvatar, deleteAvatar } from "@/lib/api/profile";

/**
 * Avatar mutations for the personal-info page. On success they bump a
 * cache-busting token on the `currentUser` query so the <img> reloads, and
 * invalidate the user so other widgets pick up the change.
 */
export function useAvatarMutations() {
  const qc = useQueryClient();

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["currentUser"] });
  };

  const upload = useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: (result) => {
      if (result.status === "success") {
        refresh();
        toast.success("Profile picture updated");
      } else if (result.status === "notsquare") {
        toast.error("Please choose a square image");
      } else {
        toast.error(result.message ?? "Could not update profile picture");
      }
    },
    onError: () => toast.error("Could not update profile picture"),
  });

  const remove = useMutation({
    mutationFn: () => deleteAvatar(),
    onSuccess: () => {
      refresh();
      toast.success("Profile picture removed");
    },
    onError: () => toast.error("Could not remove profile picture"),
  });

  return { upload, remove };
}

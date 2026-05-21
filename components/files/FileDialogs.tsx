"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

// ── New Folder Dialog ─────────────────────────────────────────────────────────

const newFolderSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name too long")
    .regex(/^[^/\\:*?"<>|]+$/, "Invalid characters in folder name"),
});

type NewFolderFormData = z.infer<typeof newFolderSchema>;

interface NewFolderDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (name: string) => Promise<void>;
}

export function NewFolderDialog({
  open,
  onOpenChange,
  onConfirm,
}: NewFolderDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewFolderFormData>({ resolver: zodResolver(newFolderSchema) });

  async function onSubmit(data: NewFolderFormData) {
    await onConfirm(data.name);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New folder</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder name</Label>
            <Input
              id="folder-name"
              autoFocus
              placeholder="My folder"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Rename Dialog ─────────────────────────────────────────────────────────────

const renameSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name too long")
    .regex(/^[^/\\:*?"<>|]+$/, "Invalid characters"),
});

type RenameFormData = z.infer<typeof renameSchema>;

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentName: string;
  onConfirm: (newName: string) => Promise<void>;
}

export function RenameDialog({
  open,
  onOpenChange,
  currentName,
  onConfirm,
}: RenameDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RenameFormData>({
    resolver: zodResolver(renameSchema),
    defaultValues: { name: currentName },
  });

  async function onSubmit(data: RenameFormData) {
    if (data.name !== currentName) {
      await onConfirm(data.name);
    }
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset({ name: currentName });
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="rename-input">New name</Label>
            <Input
              id="rename-input"
              autoFocus
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Confirm Dialog ─────────────────────────────────────────────────────

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fileName: string;
  onConfirm: () => Promise<void>;
}

export function DeleteDialog({
  open,
  onOpenChange,
  fileName,
  onConfirm,
}: DeleteDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete file</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">"{fileName}"</span>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Bulk Delete Confirm Dialog ────────────────────────────────────────────────

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  count: number;
  onConfirm: () => Promise<void>;
}

export function BulkDeleteDialog({
  open,
  onOpenChange,
  count,
  onConfirm,
}: BulkDeleteDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete {count} item{count !== 1 ? "s" : ""}</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {count} item{count !== 1 ? "s" : ""}?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete {count} item{count !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Move / Copy to Folder Dialog ──────────────────────────────────────────────

const destinationSchema = z.object({
  destination: z
    .string()
    .min(1, "Destination is required")
    .regex(/^\//, "Path must start with /"),
});

type DestinationFormData = z.infer<typeof destinationSchema>;

interface MoveDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sourceName: string;
  currentPath: string;
  onConfirm: (destination: string) => Promise<void>;
  mode: "move" | "copy";
}

export function MoveDialog({
  open,
  onOpenChange,
  sourceName,
  currentPath,
  onConfirm,
  mode,
}: MoveDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DestinationFormData>({
    resolver: zodResolver(destinationSchema),
    defaultValues: { destination: currentPath },
  });

  async function onSubmit(data: DestinationFormData) {
    await onConfirm(data.destination.replace(/\/$/, ""));
    reset();
    onOpenChange(false);
  }

  const title = mode === "move" ? "Move to" : "Copy to";
  const verb = mode === "move" ? "Move" : "Copy";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset({ destination: currentPath });
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {verb} <span className="font-medium text-foreground">"{sourceName}"</span> to a
            different folder. Enter the destination folder path.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="dest-path">Destination folder</Label>
            <Input
              id="dest-path"
              autoFocus
              placeholder="/"
              {...register("destination")}
            />
            {errors.destination && (
              <p className="text-xs text-destructive">{errors.destination.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Current location: {currentPath || "/"}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {verb}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useUploadStore } from "@/lib/stores/upload.store";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

type SessionData = { basicAuth?: string; username?: string } & Record<string, unknown>;

interface UploadDropzoneProps {
  currentPath: string;
  onClose?: () => void;
}

export function UploadDropzone({ currentPath, onClose }: UploadDropzoneProps) {
  const { data: session } = useSession();
  const basicAuth = (session as SessionData | null)?.basicAuth as string | undefined;
  const username = (session as SessionData | null)?.username as string | undefined;
  const queryClient = useQueryClient();
  const { uploads, addUpload, updateUpload, removeUpload } = useUploadStore();

  const uploadFile = useCallback(
    async (file: File) => {
      if (!basicAuth || !username) return;

      const uploadId = `${Date.now()}-${file.name}`;
      const filePath = `${currentPath}/${file.name}`.replace("//", "/");
      const davPath = `/remote.php/dav/files/${encodeURIComponent(username)}${filePath}`;

      addUpload({
        id: uploadId,
        name: file.name,
        size: file.size,
        progress: 0,
        status: "uploading",
        path: filePath,
      });

      try {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", `/api/proxy${davPath}`);
          xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              updateUpload(uploadId, {
                progress: Math.round((e.loaded / e.total) * 100),
              });
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 201 || xhr.status === 204) {
              resolve();
            } else {
              reject(new Error(`HTTP ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(file);
        });

        updateUpload(uploadId, { status: "done", progress: 100 });
        queryClient.invalidateQueries({ queryKey: ["files", currentPath] });
        toast.success(`${file.name} uploaded`);
      } catch (err) {
        updateUpload(uploadId, { status: "error" });
        toast.error(`Failed to upload ${file.name}`);
      }
    },
    [basicAuth, username, currentPath, addUpload, updateUpload, queryClient]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach(uploadFile);
    },
    [uploadFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: false,
  });

  const activeUploads = uploads.filter((u) => u.status !== "done");

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
        )}
      >
        <input {...getInputProps()} />
        <Upload
          className={cn(
            "h-10 w-10 mx-auto mb-3",
            isDragActive ? "text-primary" : "text-muted-foreground"
          )}
        />
        {isDragActive ? (
          <p className="text-sm font-medium text-primary">Drop files here</p>
        ) : (
          <>
            <p className="text-sm font-medium">
              Drag & drop files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Files will be uploaded to the current folder
            </p>
          </>
        )}
      </div>

      {/* Upload queue */}
      {uploads.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {uploads.map((upload) => (
            <div key={upload.id} className="flex items-center gap-3 text-sm">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="truncate font-medium">{upload.name}</span>
                  <span className="text-muted-foreground ml-2 shrink-0">
                    {upload.status === "done" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : upload.status === "error" ? (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                  </span>
                </div>
                {upload.status === "uploading" && (
                  <Progress value={upload.progress} className="h-1.5" />
                )}
              </div>
              {(upload.status === "done" || upload.status === "error") && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => removeUpload(upload.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {activeUploads.length === 0 && uploads.length > 0 && (
        <Button variant="outline" size="sm" onClick={onClose} className="w-full">
          Close
        </Button>
      )}
    </div>
  );
}

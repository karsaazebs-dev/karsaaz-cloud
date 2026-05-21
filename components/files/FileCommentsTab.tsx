"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { formatFileDate } from "@/lib/utils/files";
import {
  useComments,
  useAddComment,
  useDeleteComment,
} from "@/lib/hooks/useFileExtras";
import { useAuth } from "@/lib/hooks/useAuth";

export function CommentsTab({ fileId }: { fileId: number }) {
  const { username } = useAuth();
  const { data: comments, isLoading } = useComments(fileId || null);
  const addComment = useAddComment(fileId);
  const deleteComment = useDeleteComment(fileId);
  const [draft, setDraft] = useState("");

  function submit() {
    const message = draft.trim();
    if (!message) return;
    addComment.mutate(message, { onSuccess: () => setDraft("") });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Composer */}
      <div className="p-3 border-b flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Add a comment…"
          className="h-9"
        />
        <Button
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={submit}
          disabled={!draft.trim() || addComment.isPending}
          aria-label="Post comment"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Loading comments…</p>
        ) : !comments || comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No comments yet</p>
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="group flex gap-2 text-sm">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary uppercase">
                {(c.actorDisplayName || c.actorId || "?").charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {c.actorDisplayName || c.actorId}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatFileDate(c.creationDateTime)}
                  </span>
                </div>
                <p className="text-foreground whitespace-pre-wrap break-words">
                  {c.message}
                </p>
              </div>
              {c.actorId === username && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteComment.mutate(c.id)}
                  aria-label="Delete comment"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

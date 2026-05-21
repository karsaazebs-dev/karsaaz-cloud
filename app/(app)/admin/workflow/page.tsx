"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Workflow as WorkflowIcon, Trash2, Plus } from "lucide-react";
import {
  useGlobalWorkflows,
  useDeleteWorkflow,
  shortClassName,
} from "@/lib/hooks/useWorkflows";
import { WorkflowBuilder } from "@/components/admin/WorkflowBuilder";

export default function AdminWorkflowPage() {
  const { data: workflows, isLoading } = useGlobalWorkflows();
  const deleteWorkflow = useDeleteWorkflow();
  const [builderOpen, setBuilderOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-3xl">
      <WorkflowBuilder open={builderOpen} onOpenChange={setBuilderOpen} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Workflow</h1>
          <p className="text-muted-foreground text-sm">
            Automated flow rules that run when files change.
          </p>
        </div>
        <Button onClick={() => setBuilderOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New flow
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <WorkflowIcon className="h-4 w-4" />
            Active flows
          </CardTitle>
          <CardDescription>Rules configured for this instance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : !workflows || workflows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No workflow rules configured.</p>
          ) : (
            workflows.map((w) => (
              <div key={w.id} className="flex items-start gap-3 rounded-md border px-3 py-2.5 text-sm">
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-medium truncate">{w.name || shortClassName(w.class)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-[10px]">
                      {shortClassName(w.class)}
                    </Badge>
                    {w.entity && (
                      <Badge variant="outline" className="text-[10px]">
                        {shortClassName(w.entity)}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px]">
                      {w.checks.length} {w.checks.length === 1 ? "condition" : "conditions"}
                    </Badge>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteWorkflow.mutate(w.id)}
                  aria-label={`Delete ${w.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Creating new flow rules depends on the operation and condition plugins registered
        on the server. This panel lists and removes existing global rules.
      </p>
    </div>
  );
}

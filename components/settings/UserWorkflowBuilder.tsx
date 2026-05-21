"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import {
  useUserWorkflowRegistry,
  useCreateUserWorkflow,
  shortClassName,
  CORE_CHECK_OPERATORS,
} from "@/lib/hooks/useUserWorkflows";
import type { WorkflowCheck } from "@/lib/types/ocs.types";

interface DraftCheck extends WorkflowCheck {
  key: string;
}

export function UserWorkflowBuilder({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: registry, isLoading } = useUserWorkflowRegistry();
  const createWorkflow = useCreateUserWorkflow();

  const [operationClass, setOperationClass] = useState("");
  const [name, setName] = useState("");
  const [entityId, setEntityId] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const [operationValue, setOperationValue] = useState("");
  const [checks, setChecks] = useState<DraftCheck[]>([]);

  const operators = Array.isArray(registry?.operators) ? registry.operators : [];
  const entities = Array.isArray(registry?.entities) ? registry.entities : [];
  const allChecks = Array.isArray(registry?.checks) ? registry.checks : [];

  const selectedOperator = operators.find((o) => o.id === operationClass);

  // An operation may be bound to a fixed entity.
  const effectiveEntityId = selectedOperator?.fixedEntity || entityId;
  const selectedEntity = entities.find((e) => e.id === effectiveEntityId);

  // Checks valid for the selected entity (empty supportedEntities = global).
  const availableChecks = useMemo(
    () =>
      allChecks.filter(
        (c) =>
          c.supportedEntities.length === 0 ||
          (effectiveEntityId && c.supportedEntities.includes(effectiveEntityId))
      ),
    [allChecks, effectiveEntityId]
  );

  function reset() {
    setOperationClass("");
    setName("");
    setEntityId("");
    setEvents([]);
    setOperationValue("");
    setChecks([]);
  }

  function toggleEvent(eventName: string) {
    setEvents((prev) =>
      prev.includes(eventName) ? prev.filter((e) => e !== eventName) : [...prev, eventName]
    );
  }

  function addCheck() {
    const first = availableChecks[0];
    if (!first) return;
    setChecks((prev) => [
      ...prev,
      { key: crypto.randomUUID(), class: first.id, operator: "", value: "" },
    ]);
  }

  function updateCheck(key: string, patch: Partial<WorkflowCheck>) {
    setChecks((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  }

  function removeCheck(key: string) {
    setChecks((prev) => prev.filter((c) => c.key !== key));
  }

  const canSubmit =
    !!operationClass && !!name.trim() && !!effectiveEntityId && events.length > 0;

  function submit() {
    if (!canSubmit) return;
    createWorkflow.mutate(
      {
        class: operationClass,
        name: name.trim(),
        entity: effectiveEntityId,
        events,
        operation: operationValue,
        checks: checks.map(({ class: c, operator, value }) => ({ class: c, operator, value })),
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New flow</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Loading registry…</p>
        ) : operators.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No workflow operations available</p>
            <p className="text-sm text-muted-foreground">
              Enable an app that provides personal workflow operations (e.g. automated
              tagging) to create your own flow rules.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Operation */}
            <div className="space-y-1.5">
              <Label>Operation</Label>
              <Select
                value={operationClass}
                onValueChange={(v) => {
                  setOperationClass(v);
                  setChecks([]);
                  setEvents([]);
                }}
              >
                <SelectTrigger><SelectValue placeholder="Choose what happens" /></SelectTrigger>
                <SelectContent>
                  {operators.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedOperator?.description && (
                <p className="text-xs text-muted-foreground">{selectedOperator.description}</p>
              )}
            </div>

            {selectedOperator && (
              <>
                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="wf-name">Flow name</Label>
                  <Input id="wf-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My flow" />
                </div>

                {/* Entity */}
                <div className="space-y-1.5">
                  <Label>Applies to</Label>
                  <Select
                    value={effectiveEntityId}
                    onValueChange={setEntityId}
                    disabled={!!selectedOperator.fixedEntity}
                  >
                    <SelectTrigger><SelectValue placeholder="Choose entity" /></SelectTrigger>
                    <SelectContent>
                      {entities.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Events */}
                {selectedEntity && (
                  <div className="space-y-1.5">
                    <Label>When</Label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {selectedEntity.events.map((ev) => (
                        <label key={ev.eventName} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={events.includes(ev.eventName)}
                            onCheckedChange={() => toggleEvent(ev.eventName)}
                          />
                          {ev.displayName}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Operation value */}
                {!selectedOperator.isComplex && (
                  <div className="space-y-1.5">
                    <Label htmlFor="wf-op-value">Action value</Label>
                    <Input
                      id="wf-op-value"
                      value={operationValue}
                      onChange={(e) => setOperationValue(e.target.value)}
                      placeholder={selectedOperator.triggerHint || "Value"}
                    />
                  </div>
                )}

                {/* Checks */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Conditions</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7"
                      onClick={addCheck}
                      disabled={availableChecks.length === 0}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add
                    </Button>
                  </div>
                  {checks.length === 0 && (
                    <p className="text-xs text-muted-foreground">No conditions — the flow runs every time.</p>
                  )}
                  {checks.map((chk) => {
                    const ops = CORE_CHECK_OPERATORS[chk.class];
                    return (
                      <div key={chk.key} className="rounded-md border p-2 space-y-2">
                        <div className="flex gap-2">
                          <Select value={chk.class} onValueChange={(v) => updateCheck(chk.key, { class: v, operator: "" })}>
                            <SelectTrigger className="h-8 flex-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {availableChecks.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{shortClassName(c.id)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => removeCheck(chk.key)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          {ops ? (
                            <Select value={chk.operator} onValueChange={(v) => updateCheck(chk.key, { operator: v })}>
                              <SelectTrigger className="h-8 w-40 shrink-0"><SelectValue placeholder="operator" /></SelectTrigger>
                              <SelectContent>
                                {ops.map((o) => (
                                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              className="h-8 w-40 shrink-0"
                              value={chk.operator}
                              onChange={(e) => updateCheck(chk.key, { operator: e.target.value })}
                              placeholder="operator"
                            />
                          )}
                          <Input
                            className="h-8 flex-1"
                            value={chk.value}
                            onChange={(e) => updateCheck(chk.key, { value: e.target.value })}
                            placeholder="value"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!canSubmit || createWorkflow.isPending}>
            {createWorkflow.isPending ? "Creating…" : "Create flow"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileTypeChart } from "./widgets/FileTypeChart";
import { MonthlyUploadsChart } from "./widgets/MonthlyUploadsChart";
import { ActivityTrendsChart } from "./widgets/ActivityTrendsChart";
import { StorageChart } from "./widgets/StorageChart";
import { StatsCards } from "./StatsCards";
import {
  loadWidgetLayout,
  saveWidgetLayout,
  type WidgetId,
  type WidgetLayout,
} from "@/lib/hooks/useDashboard";
import { GripVertical, Eye, EyeOff, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

const WIDGET_CONTENT: Record<WidgetId, React.ReactNode> = {
  chartFileType: <FileTypeChart />,
  chartMonthlyUploads: <MonthlyUploadsChart />,
  chartActivityTrends: <ActivityTrendsChart />,
  chartStorage: <StorageChart />,
};

interface SortableWidgetProps {
  widget: WidgetLayout;
  onToggle: (id: WidgetId) => void;
}

function SortableWidget({ widget, onToggle }: SortableWidgetProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: widget.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={cn(
          "relative flex flex-col min-h-[200px] shadow-sm transition-shadow",
          isDragging && "shadow-xl ring-2 ring-primary/30"
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-none"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <CardTitle className="text-sm font-semibold">{widget.label}</CardTitle>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => onToggle(widget.id)}
            title={widget.enabled ? "Hide widget" : "Show widget"}
          >
            {widget.enabled ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto pt-0">
          <AnimatePresence>
            {widget.enabled ? (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {WIDGET_CONTENT[widget.id]}
              </motion.div>
            ) : (
              <motion.div
                key="hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-16 text-muted-foreground text-sm"
              >
                Widget hidden
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}

export function DashboardGrid() {
  const [widgets, setWidgets] = useState<WidgetLayout[]>([]);
  const [showCustomizer, setShowCustomizer] = useState(false);

  useEffect(() => {
    setWidgets(loadWidgetLayout());
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        setWidgets((prev) => {
          const oldIndex = prev.findIndex((w) => w.id === active.id);
          const newIndex = prev.findIndex((w) => w.id === over.id);
          const next = arrayMove(prev, oldIndex, newIndex).map((w, i) => ({
            ...w,
            order: i,
          }));
          saveWidgetLayout(next);
          return next;
        });
      }
    },
    []
  );

  const handleToggle = useCallback((id: WidgetId) => {
    setWidgets((prev) => {
      const next = prev.map((w) =>
        w.id === id ? { ...w, enabled: !w.enabled } : w
      );
      saveWidgetLayout(next);
      return next;
    });
  }, []);

  return (
    <div className="space-y-4" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
      {/* Dashboard header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground font-medium">Your Karsaaz Cloud overview</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCustomizer(!showCustomizer)}
          className="gap-2 rounded-xl font-bold border-slate-200/80 hover:bg-slate-50 transition-colors"
        >
          <Settings2 className="h-4 w-4" />
          Customize
        </Button>
      </div>

      {/* Customize hint */}
      <AnimatePresence>
        {showCustomizer && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-lg border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground"
          >
            <strong className="text-foreground">Drag</strong> widgets to reorder ·{" "}
            <strong className="text-foreground">Click the eye icon</strong> to show/hide widgets
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards Overview */}
      <StatsCards />

      {/* Widget grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={widgets.map((w) => w.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
            {widgets.map((widget) => (
              <SortableWidget
                key={widget.id}
                widget={widget}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

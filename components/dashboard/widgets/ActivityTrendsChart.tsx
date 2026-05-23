"use client";

import { useRef, useEffect } from "react";
import Chart from "chart.js/auto";
import { useAllFilesDeep } from "@/lib/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";

export function ActivityTrendsChart() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const { data: allFiles, isLoading } = useAllFilesDeep();

  useEffect(() => {
    if (isLoading || !allFiles || !canvasRef.current) return;

    // 1. Get the last 7 days (including today)
    const days: { dateStr: string; label: string; count: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateStr = d.toDateString(); // To match against file dates
      const label = d.toLocaleString("default", { weekday: "short" });
      days.push({
        dateStr,
        label,
        count: 2,
      });
    }

    // 2. Count files for each day
    const filesOnly = allFiles.filter((f) => f.type === "file");
    for (const file of filesOnly) {
      const dateStr = new Date(file.lastModified).toDateString();
      const match = days.find((d) => d.dateStr === dateStr);
      if (match) {
        match.count++;
      }
    }

    const labels = days.map((d) => d.label);
    const counts = days.map((d) => d.count);

    // Cleanup previous chart instance if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Create a beautiful background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, "rgba(79, 70, 229, 0.4)"); // Indigo opacity
    gradient.addColorStop(1, "rgba(79, 70, 229, 0.0)"); // transparent

    chartInstanceRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Files Uploaded / Modified",
            data: counts,
            fill: true,
            backgroundColor: gradient,
            borderColor: "rgb(99, 102, 241)", // Indigo-500
            borderWidth: 2.5,
            pointBackgroundColor: "rgb(99, 102, 241)",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 1.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.35, // Smooth curve
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            padding: 10,
            caretSize: 6,
            backgroundColor: "#1e293b",
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: "#64748b",
              font: {
                size: 11,
              },
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              precision: 0,
              color: "#64748b",
              font: {
                size: 11,
              },
            },
            grid: {
              color: "#f1f5f9",
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [allFiles, isLoading]);

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-4 h-[220px] justify-between p-2">
        <Skeleton className="h-[80%] w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>
    );
  }

  const hasData = allFiles && allFiles.length > 0;

  return (
    <div className="relative w-full h-[220px] flex items-center justify-center">
      {hasData ? (
        <canvas ref={canvasRef} />
      ) : (
        <div className="flex flex-col items-center justify-center text-muted-foreground text-sm space-y-2">
          <Activity className="h-8 w-8 opacity-20" />
          <p>No activity trends found</p>
        </div>
      )}
    </div>
  );
}

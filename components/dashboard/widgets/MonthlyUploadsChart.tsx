"use client";

import { useRef, useEffect } from "react";
import Chart from "chart.js/auto";
import { useAllFilesDeep } from "@/lib/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";

export function MonthlyUploadsChart() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const { data: allFiles, isLoading } = useAllFilesDeep();

  useEffect(() => {
    if (isLoading || !allFiles || !canvasRef.current) return;

    // 1. Get the last 6 months
    const months: {
      label: string;
      year: number;
      monthIndex: number;
      count: number;
      breakdown: {
        folders: number;
        images: number;
        videos: number;
        pdfs: number;
        documents: number;
        others: number;
      };
    }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleString("default", { month: "short" }),
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        count: 0,
        breakdown: {
          folders: 0,
          images: 0,
          videos: 0,
          pdfs: 0,
          documents: 0,
          others: 0,
        },
      });
    }

    // 2. Count files in each month and aggregate by type
    for (const file of allFiles) {
      const date = new Date(file.lastModified);
      const fileYear = date.getFullYear();
      const fileMonth = date.getMonth();

      const match = months.find((m) => m.year === fileYear && m.monthIndex === fileMonth);
      if (match) {
        match.count++;
        if (file.type === "directory") {
          match.breakdown.folders++;
        } else {
          switch (file.fileType) {
            case "image":
              match.breakdown.images++;
              break;
            case "video":
              match.breakdown.videos++;
              break;
            case "pdf":
              match.breakdown.pdfs++;
              break;
            case "document":
            case "spreadsheet":
            case "presentation":
            case "text":
              match.breakdown.documents++;
              break;
            default:
              match.breakdown.others++;
              break;
          }
        }
      }
    }

    const labels = months.map((m) => m.label);
    const counts = months.map((m) => m.count);

    // Cleanup previous chart instance if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Create a beautiful background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, "rgba(168, 85, 247, 0.85)"); // Theme Purple
    gradient.addColorStop(1, "rgba(79, 70, 229, 0.15)"); // Indigo fading out

    chartInstanceRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Files Uploaded / Modified",
            data: counts,
            backgroundColor: gradient,
            hoverBackgroundColor: "rgba(168, 85, 247, 1)",
            borderRadius: 6,
            borderWidth: 0,
            barThickness: 24,
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
            callbacks: {
              label: function (context) {
                const monthObj = months[context.dataIndex];
                const bd = monthObj.breakdown;
                const lines = [
                  `Total Items: ${monthObj.count}`,
                ];
                if (bd.folders > 0) lines.push(`· Folders: ${bd.folders}`);
                if (bd.images > 0) lines.push(`· Images: ${bd.images}`);
                if (bd.videos > 0) lines.push(`· Videos: ${bd.videos}`);
                if (bd.pdfs > 0) lines.push(`· PDFs: ${bd.pdfs}`);
                if (bd.documents > 0) lines.push(`· Documents: ${bd.documents}`);
                if (bd.others > 0) lines.push(`· Others: ${bd.others}`);
                return lines;
              },
            },
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
      <div className="flex flex-col space-y-3 h-[220px] justify-end p-2">
        <div className="flex items-end space-x-4 h-[180px]">
          <Skeleton className="h-[20%] flex-1 rounded-t" />
          <Skeleton className="h-[50%] flex-1 rounded-t" />
          <Skeleton className="h-[80%] flex-1 rounded-t" />
          <Skeleton className="h-[40%] flex-1 rounded-t" />
          <Skeleton className="h-[60%] flex-1 rounded-t" />
          <Skeleton className="h-[90%] flex-1 rounded-t" />
        </div>
        <div className="flex justify-between">
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
          <BarChart3 className="h-8 w-8 opacity-20" />
          <p>No activity data</p>
        </div>
      )}
    </div>
  );
}

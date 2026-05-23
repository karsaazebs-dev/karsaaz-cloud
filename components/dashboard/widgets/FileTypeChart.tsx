"use client";

import { useRef, useEffect } from "react";
import Chart from "chart.js/auto";
import { useAllFilesDeep, useQuota } from "@/lib/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { formatFileSize } from "@/lib/utils/files";
import { PieChart } from "lucide-react";

export function FileTypeChart() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const { data: allFiles, isLoading: isFilesLoading } = useAllFilesDeep();
  const { data: quota, isLoading: isQuotaLoading } = useQuota();

  const isLoading = isFilesLoading || isQuotaLoading;

  useEffect(() => {
    if (isLoading || !allFiles || !canvasRef.current) return;

    // Process file counts
    let foldersCount = 0;
    let imagesCount = 0;
    let videosCount = 0;
    let pdfsCount = 0;
    let docsCount = 0;
    let othersCount = 0;

    for (const f of allFiles) {
      if (f.type === "directory") {
        foldersCount++;
      } else {
        switch (f.fileType) {
          case "image":
            imagesCount++;
            break;
          case "video":
            videosCount++;
            break;
          case "pdf":
            pdfsCount++;
            break;
          case "document":
          case "spreadsheet":
          case "presentation":
          case "text":
            docsCount++;
            break;
          default:
            othersCount++;
            break;
        }
      }
    }

    const dataValues = [foldersCount, imagesCount, videosCount, pdfsCount, docsCount, othersCount];
    const labels = ["Folders", "Images", "Videos", "PDFs", "Documents", "Others"];
    const colors = [
      "#F59E0B", // Amber (Folders)
      "#A855F7", // Purple (Images)
      "#F43F5E", // Rose (Videos)
      "#EF4444", // Red (PDFs)
      "#3B82F6", // Blue (Documents)
      "#94A3B8", // Slate (Others)
    ];

    // Cleanup previous chart instance if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const usedText = quota ? formatFileSize(quota.used ?? 0) : "";

    // Custom plugin to draw centered text in the doughnut hole
    const centerTextPlugin = {
      id: "centerText",
      beforeDraw(chart: any) {
        const { ctx } = chart;
        ctx.save();

        const chartArea = chart.chartArea;
        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.top + chartArea.bottom) / 2;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // 1. Draw "Storage" label
        ctx.font = "bold 11px var(--font-plus-jakarta), sans-serif";
        ctx.fillStyle = "#94A3B8"; // slate-400
        ctx.fillText("STORAGE", centerX, centerY - 10);

        // 2. Draw used size
        ctx.font = "extrabold 15px var(--font-plus-jakarta), sans-serif";
        ctx.fillStyle = "#1E293B"; // slate-800
        ctx.fillText(usedText, centerX, centerY + 10);

        ctx.restore();
      },
    };

    chartInstanceRef.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: dataValues,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: "#ffffff",
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              boxWidth: 12,
              padding: 15,
              font: {
                size: 11,
                weight: "normal",
              },
              color: "#475569",
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || "";
                const val = context.raw || 0;
                const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((val as number) / total * 100).toFixed(1) : "0";
                return ` ${label}: ${val} (${percentage}%)`;
              },
            },
            padding: 10,
            caretSize: 6,
            backgroundColor: "#1e293b",
          },
        },
        cutout: "60%",
      },
      plugins: [centerTextPlugin],
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [allFiles, quota, isLoading]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 h-[220px]">
        <Skeleton className="h-[150px] w-[150px] rounded-full animate-pulse" />
        <div className="flex gap-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
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
          <PieChart className="h-8 w-8 opacity-20" />
          <p>No files found</p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useRef, useEffect } from "react";
import Chart from "chart.js/auto";
import { useQuota } from "@/lib/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { formatFileSize } from "@/lib/utils/files";
import { HardDrive } from "lucide-react";

export function StorageChart() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const { data: quota, isLoading } = useQuota();

  useEffect(() => {
    if (isLoading || !quota || !canvasRef.current) return;

    const used = quota.used ?? 0;
    const rawTotal = quota.total;
    const isUnlimited = rawTotal < 0 || quota.quota < 0;
    const total = isUnlimited ? 50 * 1024 * 1024 * 1024 : rawTotal;
    const free = Math.max(0, total - used);

    const isDark = document.documentElement.classList.contains("dark");
    const freeColor = isDark ? "#334155" : "#E2E8F0"; // slate-700 vs slate-200
    const usedColor = "#3B82F6"; // blue-500 (premium theme blue)

    const dataValues = [used, free];
    const labels = ["Used Storage", "Free Storage"];
    const colors = [usedColor, freeColor];

    // Cleanup previous chart instance if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const usedText = formatFileSize(used);
    const totalText = `of ${formatFileSize(total)}`;

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

        const currentIsDark = document.documentElement.classList.contains("dark");
        const labelColor = currentIsDark ? "#94A3B8" : "#64748B"; // slate-400 vs slate-500
        const valColor = currentIsDark ? "#F8FAFC" : "#1E293B"; // slate-50 vs slate-800
        const subColor = currentIsDark ? "#64748B" : "#475569"; // slate-500 vs slate-600

        // 1. Draw "USED" label
        ctx.font = "bold 10px var(--font-plus-jakarta), sans-serif";
        ctx.fillStyle = labelColor;
        ctx.fillText("USED", centerX, centerY - 18);

        // 2. Draw used size
        ctx.font = "extrabold 16px var(--font-plus-jakarta), sans-serif";
        ctx.fillStyle = valColor;
        ctx.fillText(usedText, centerX, centerY);

        // 3. Draw total size
        ctx.font = "medium 11px var(--font-plus-jakarta), sans-serif";
        ctx.fillStyle = subColor;
        ctx.fillText(totalText, centerX, centerY + 18);

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
            borderColor: isDark ? "#1e293b" : "#ffffff", // slate-800 vs white
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
              color: isDark ? "#94A3B8" : "#475569",
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || "";
                const val = context.raw as number;
                const totalBytes = used + free;
                const percentage = totalBytes > 0 ? ((val / totalBytes) * 100).toFixed(1) : "0";
                return ` ${label}: ${formatFileSize(val)} (${percentage}%)`;
              },
            },
            padding: 10,
            caretSize: 6,
            backgroundColor: "#1e293b",
          },
        },
        cutout: "65%",
      },
      plugins: [centerTextPlugin],
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [quota, isLoading]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 h-[220px]">
        <Skeleton className="h-[150px] w-[150px] rounded-full animate-pulse" />
        <div className="flex gap-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[220px] flex items-center justify-center">
      {quota ? (
        <canvas ref={canvasRef} />
      ) : (
        <div className="flex flex-col items-center justify-center text-muted-foreground text-sm space-y-2">
          <HardDrive className="h-8 w-8 opacity-20" />
          <p>Storage data unavailable</p>
        </div>
      )}
    </div>
  );
}

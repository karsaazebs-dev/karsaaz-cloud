"use client";

import { useQuota, useAllFilesDeep } from "@/lib/hooks/useDashboard";
import { useTrash, useFavorites } from "@/lib/hooks/useVersionsTrash";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatFileSize } from "@/lib/utils/files";
import { HardDrive, Share2 } from "lucide-react";
import { GroupFolderIcon, YellowStarIcon } from "@/components/icons/CustomIcons";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function StatsCards() {
  const { data: quota, isLoading: isQuotaLoading } = useQuota();
  const { data: allFiles, isLoading: isFilesLoading } = useAllFilesDeep();
  const { data: trash, isLoading: isTrashLoading } = useTrash();
  const { data: favorites, isLoading: isFavsLoading } = useFavorites();

  const isLoading = isQuotaLoading || isFilesLoading || isTrashLoading || isFavsLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden border border-slate-100/80 shadow-sm">
            <CardContent className="p-5 flex flex-col justify-between h-[115px]">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <Skeleton className="h-6 w-16 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // 1. Quota Calculations
  const usedStorage = quota?.used ?? 0;
  const rawTotal = quota?.total ?? 0;
  const isUnlimitedServer = rawTotal <= 0 || (quota?.quota !== undefined && quota.quota < 0);
  // Default to 50 GB if capacity is unlimited (50 * 1024 * 1024 * 1024 bytes)
  const totalStorage = isUnlimitedServer ? 50 * 1024 * 1024 * 1024 : rawTotal;
  const pctUsed = totalStorage > 0 ? Math.min((usedStorage / totalStorage) * 100, 100) : 0;

  // 2. Folders & Files Counts
  const totalFolders = allFiles?.filter((f) => f.type === "directory").length ?? 0;
  const totalFiles = allFiles?.filter((f) => f.type === "file").length ?? 0;

  // 3. Favorites & Shared
  const favCount = favorites?.length ?? 0;
  const sharedCount = allFiles?.filter((f) => f.isShared || (f.shareTypes && f.shareTypes.length > 0)).length ?? 0;

  const cardData = [
    {
      title: "Storage Used",
      value: `${formatFileSize(usedStorage)} / ${formatFileSize(totalStorage)}`,
      subtext: `of ${formatFileSize(totalStorage)} used`,
      iconElement: <HardDrive className="h-5 w-5 text-blue-500" />,
      bgColor: "bg-blue-50",
      progressBar: pctUsed,
      href: "/dashboard",
      valueClassName: "text-[16px] xl:text-[18px]",
    },
    {
      title: "Folders & Files",
      value: (totalFolders + totalFiles).toString(),
      subtext: `${totalFolders} Folders · ${totalFiles} Files`,
      iconElement: <GroupFolderIcon className="h-5 w-6 shrink-0" />,
      bgColor: "bg-yellow-50/50",
      progressBar: null,
      href: "/files",
      valueClassName: "text-2xl",
    },
    {
      title: "Favorites",
      value: favCount.toString(),
      subtext: `${favCount} Favorited items`,
      iconElement: <YellowStarIcon className="h-5 w-5 shrink-0" />,
      bgColor: "bg-yellow-50/50",
      progressBar: null,
      href: "/favorites",
      valueClassName: "text-2xl",
    },
    {
      title: "Shared Files",
      value: sharedCount.toString(),
      subtext: `${sharedCount} items shared with others`,
      iconElement: <Share2 className="h-5 w-5 text-indigo-500" />,
      bgColor: "bg-indigo-50/50",
      progressBar: null,
      href: "/files/shared/others",
      valueClassName: "text-2xl",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
      {cardData.map((card, idx) => {
        return (
          <Link key={idx} href={card.href}>
            <Card className="group relative overflow-hidden border border-slate-100 hover:border-[#A855F7]/30 hover:shadow-md transition-all duration-300 cursor-pointer bg-white">
              <CardContent className="p-5 flex flex-col justify-between h-[120px]">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 min-w-0">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      {card.title}
                    </span>
                    <span className={cn("font-extrabold text-slate-800 block tracking-tight truncate", card.valueClassName)}>
                      {card.value}
                    </span>
                  </div>
                  <div className={`p-2 rounded-xl ${card.bgColor} shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    {card.iconElement}
                  </div>
                </div>

                <div className="w-full mt-2">
                  {card.progressBar !== null && card.progressBar !== undefined ? (
                    <div className="space-y-1.5">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-[#A855F7] rounded-full transition-all duration-500"
                          style={{ width: `${card.progressBar}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 leading-none">
                        <span>{card.progressBar.toFixed(1)}% full</span>
                        <span>{formatFileSize(totalStorage - usedStorage)} free</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-500 leading-none block">
                      {card.subtext}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

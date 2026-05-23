"use client";

import { useState, useRef, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  List,
  Check,
  Tag,
  ChevronRight,
  ChevronDown,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FilterIcon, GroupFolderIcon, Search1Icon, CutIcon } from "@/components/icons/CustomIcons";

function ModifiedIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M16.7454 1.66152L12.2761 1.66154V0.555142C12.2761 0.248426 12.0263 0 11.7179 0C11.4095 0 11.1597 0.248426 11.1597 0.555142V1.66126H6.69426V0.555142C6.69426 0.248426 6.44447 0 6.13608 0C5.82768 0 5.5779 0.248426 5.5779 0.555142V1.66126H1.11636C0.49985 1.66126 0 2.15839 0 2.77155V16.6501C0 17.2632 0.49985 17.7604 1.11636 17.7604H16.7454C17.3619 17.7604 17.8618 17.2632 17.8618 16.6501V2.77155C17.8618 2.15865 17.3619 1.66152 16.7454 1.66152ZM16.7454 16.6501H1.11636V2.77155H5.5779V3.33085C5.5779 3.63755 5.82768 3.886 6.13608 3.886C6.44447 3.886 6.69426 3.63755 6.69426 3.33085V2.77183H11.1597V3.33113C11.1597 3.63785 11.4095 3.88627 11.7179 3.88627C12.0263 3.88627 12.2761 3.63785 12.2761 3.33113V2.77183H16.7454V16.6501ZM12.8381 8.87837H13.9545C14.2626 8.87837 14.5127 8.62967 14.5127 8.32323V7.21295C14.5127 6.90651 14.2626 6.6578 13.9545 6.6578H12.8381C12.53 6.6578 12.28 6.90651 12.28 7.21295V8.32323C12.28 8.62967 12.53 8.87837 12.8381 8.87837ZM12.8381 13.3192H13.9545C14.2626 13.3192 14.5127 13.0708 14.5127 12.7641V11.6538C14.5127 11.3474 14.2626 11.0987 13.9545 11.0987H12.8381C12.53 11.0987 12.28 11.3474 12.28 11.6538V12.7641C12.28 13.0711 12.53 13.3192 12.8381 13.3192ZM9.48906 11.0987H8.3727C8.06459 11.0987 7.81452 11.3474 7.81452 11.6538V12.7641C7.81452 13.0708 8.06459 13.3192 8.3727 13.3192H9.48906C9.79718 13.3192 10.0472 13.0708 10.0472 12.7641V11.6538C10.0472 11.3476 9.79718 11.0987 9.48906 11.0987ZM9.48906 6.6578H8.3727C8.06459 6.6578 7.81452 6.90651 7.81452 7.21295V8.32323C7.81452 8.62967 8.06459 8.87837 8.3727 8.87837H9.48906C9.79718 8.87837 10.0472 8.62967 10.0472 8.32323V7.21295C10.0472 6.90623 9.79718 6.6578 9.48906 6.6578ZM5.02362 6.6578H3.90726C3.59915 6.6578 3.34908 6.90651 3.34908 7.21295V8.32323C3.34908 8.62967 3.59915 8.87837 3.90726 8.87837H5.02362C5.33174 8.87837 5.5818 8.62967 5.5818 8.32323V7.21295C5.5818 6.90623 5.33174 6.6578 5.02362 6.6578ZM5.02362 11.0987H3.90726C3.59915 11.0987 3.34908 11.3474 3.34908 11.6538V12.7641C3.34908 13.0708 3.59915 13.3192 3.90726 13.3192H5.02362C5.33174 13.3192 5.5818 13.0708 5.5818 12.7641V11.6538C5.5818 11.3476 5.33174 11.0987 5.02362 11.0987Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PeopleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g clipPath="url(#clip_people_custom)">
        <path
          d="M15.7032 6.5625C15.5887 8.15117 14.4102 9.375 13.1251 9.375C11.8399 9.375 10.6594 8.15156 10.5469 6.5625C10.4297 4.90977 11.577 3.75 13.1251 3.75C14.6731 3.75 15.8204 4.93984 15.7032 6.5625Z"
          stroke="currentColor"
          strokeWidth="1.11111"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.125 11.875C10.5793 11.875 8.13122 13.1395 7.51794 15.602C7.43669 15.9277 7.64098 16.25 7.97575 16.25H18.2746C18.6093 16.25 18.8125 15.9277 18.7324 15.602C18.1191 13.1 15.6711 11.875 13.125 11.875Z"
          stroke="currentColor"
          strokeWidth="1.11111"
          strokeMiterlimit="10"
        />
        <path
          d="M7.81251 7.26328C7.7211 8.53203 6.76876 9.53125 5.74219 9.53125C4.71563 9.53125 3.76173 8.53242 3.67188 7.26328C3.57852 5.94336 4.50548 5 5.74219 5C6.97891 5 7.90587 5.96758 7.81251 7.26328Z"
          stroke="currentColor"
          strokeWidth="1.11111"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.04689 11.9531C7.34181 11.6301 6.56525 11.5059 5.7422 11.5059C3.71095 11.5059 1.75392 12.5156 1.26369 14.4824C1.19923 14.7426 1.36252 15 1.6297 15H6.01564"
          stroke="currentColor"
          strokeWidth="1.11111"
          strokeMiterlimit="10"
          strokeLinecap="round"
        />
      </g>
      <defs>
        <clipPath id="clip_people_custom">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

function GridViewIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g clipPath="url(#clip_grid_custom)">
        <path
          d="M1.5 10.5C1.098 10.5 0.7475 10.3505 0.4485 10.0515C0.1495 9.7525 0 9.402 0 9V1.5C0 1.098 0.1495 0.7475 0.4485 0.4485C0.7475 0.1495 1.098 0 1.5 0H9C9.402 0 9.7525 0.1495 10.0515 0.4485C10.3505 0.7475 10.5 1.098 10.5 1.5V9C10.5 9.402 10.3505 9.7525 10.0515 10.0515C9.7525 10.3505 9.402 10.5 9 10.5H1.5ZM1.5 24C1.098 24 0.7475 23.8505 0.4485 23.5515C0.1495 23.2525 0 22.902 0 22.5V15C0 14.598 0.1495 14.2475 0.4485 13.9485C0.7475 13.6495 1.098 13.5 1.5 13.5H9C9.402 13.5 9.7525 13.6495 10.0515 13.9485C10.3505 14.2475 10.5 14.598 10.5 15V22.5C10.5 22.902 10.3505 23.2525 10.0515 23.5515C9.7525 23.8505 9.402 24 9 24H1.5ZM15 10.5C14.598 10.5 14.2475 10.3505 13.9485 10.0515C13.6495 9.7525 13.5 9.402 13.5 9V1.5C13.5 1.098 13.6495 0.7475 13.9485 0.4485C14.2475 0.1495 14.598 0 15 0H22.5C22.902 0 23.2525 0.1495 23.5515 0.4485C23.8505 0.7475 24 1.098 24 1.5V9C24 9.402 23.8505 9.7525 23.5515 10.0515C23.2525 10.3505 22.902 10.5 22.5 10.5H15ZM15 24C14.598 24 14.2475 23.8505 13.9485 23.5515C13.6495 23.2525 13.5 22.902 13.5 22.5V15C13.5 14.598 13.6495 14.2475 13.9485 13.9485C14.2475 13.6495 14.598 13.5 15 13.5H22.5C22.902 13.5 23.2525 13.6495 23.5515 13.9485C23.8505 14.2475 24 14.598 24 15V22.5C24 22.902 23.8505 23.2525 23.5515 23.5515C23.2525 23.8505 22.902 24 22.5 24H15Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip_grid_custom">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

const TAG_COLORS = [
  { value: "red", label: "Red", colorClass: "bg-red-500" },
  { value: "orange", label: "Orange", colorClass: "bg-orange-500" },
  { value: "yellow", label: "Yellow", colorClass: "bg-yellow-500" },
  { value: "blue", label: "Blue", colorClass: "bg-blue-500" },
];

interface FileToolbarProps {
  selectedCount: number;
  onDeleteSelected: () => void;

  // Filter controls
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  typeFilter: string;
  setTypeFilter: (t: string) => void;
  dateFilter: string;
  setDateFilter: (d: string) => void;
  peopleFilter: string;
  setPeopleFilter: (p: string) => void;
  tagFilter: string;
  setTagFilter: (t: string) => void;
  availableTags: { name: string; colorClass: string }[];
  onCreateTag?: (name: string, colorClass: string) => void;

  // View mode
  fileViewMode: "list" | "grid";
  setFileViewMode: (m: "list" | "grid") => void;

  // Selection controls
  isAllSelected: boolean;
  onToggleSelectAll: (checked: boolean) => void;
}

export function FileToolbar({
  selectedCount,
  onDeleteSelected,
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  dateFilter,
  setDateFilter,
  peopleFilter,
  setPeopleFilter,
  tagFilter,
  setTagFilter,
  availableTags,
  onCreateTag,
  fileViewMode,
  setFileViewMode,
  isAllSelected,
  onToggleSelectAll,
}: FileToolbarProps) {
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("blue");
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false);
  const colorDropdownRef = useRef<HTMLDivElement>(null);

  // Close color dropdown when clicking outside
  useEffect(() => {
    if (!colorDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(e.target as Node)) {
        setColorDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [colorDropdownOpen]);
  const hasActiveFilters =
    typeFilter !== "all" ||
    dateFilter !== "all" ||
    peopleFilter !== "all" ||
    tagFilter !== "all" ||
    searchQuery !== "";

  const clearAllFilters = () => {
    setTypeFilter("all");
    setDateFilter("all");
    setPeopleFilter("all");
    setTagFilter("all");
    setSearchQuery("");
  };

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4 bg-background border-b select-none shrink-0 flex-wrap">
      {/* Left: Checkbox + Flat Filter Dropdowns + View Toggle */}
      <div className="flex items-center gap-6 flex-wrap">
        {/* Bulk select checkbox (direct borderless placement) */}
        <div className="flex items-center justify-center pl-1">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={(v) => onToggleSelectAll(!!v)}
            aria-label="Select all items"
          />
        </div>

        {/* Tags Filter (Flat trigger) — placed before Type */}
        <DropdownMenu onOpenChange={(open) => {
          if (!open) {
            setIsCreatingTag(false);
            setNewTagName("");
            setColorDropdownOpen(false);
          }
        }}>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-1.5 py-1.5 px-2.5 text-sm font-semibold hover:bg-accent/50 rounded-lg transition-colors cursor-pointer outline-none",
                tagFilter !== "all"
                  ? "text-[#A855F7] bg-[#A855F7]/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Tags{tagFilter !== "all" ? `: ${tagFilter}` : ""}</span>
              {tagFilter !== "all" && <span className="sm:hidden text-[10px] text-[#A855F7] font-bold">*</span>}
            </button>
          </DropdownMenuTrigger>
          {/* Outer wrapper: flex row — tag list always visible, create panel slides in to the right */}
          <DropdownMenuContent
            align="start"
            className={cn("p-0 overflow-visible", isCreatingTag ? "w-auto" : "w-52")}
          >
            <div className="flex items-stretch">
              {/* ── Left: Tag List ── */}
              <div className="w-52 p-1 shrink-0">
                {availableTags.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground italic">No tags found</div>
                ) : (
                  availableTags.map((tag) => {
                    const isActive = tagFilter === tag.name;
                    return (
                      <DropdownMenuItem
                        key={tag.name}
                        onClick={() => setTagFilter(isActive ? "all" : tag.name)}
                        className="justify-between cursor-pointer font-medium gap-2"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={cn("w-2.5 h-2.5 rounded-full shrink-0", tag.colorClass)}
                          />
                          {tag.name}
                        </span>
                        {isActive && <Check className="h-4 w-4 text-[#A855F7]" />}
                      </DropdownMenuItem>
                    );
                  })
                )}
                <div className="border-t my-1" />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsCreatingTag(true);
                  }}
                  className="cursor-pointer font-semibold text-[#A855F7] gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create New</span>
                </DropdownMenuItem>
              </div>

              {/* ── Right: Create New Form Panel (appears when isCreatingTag) ── */}
              {isCreatingTag && (
                <div
                  className="w-52 border-l border-border bg-popover p-4 flex flex-col gap-3 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Name Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Enter Name"
                      className="w-full px-3 py-1.5 text-sm border border-border rounded-lg bg-background outline-none focus:border-[#A855F7]/60 focus:ring-1 focus:ring-[#A855F7]/20 transition-all placeholder:text-muted-foreground/60 font-medium"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newTagName.trim()) {
                          const colorObj = TAG_COLORS.find((c) => c.value === newTagColor) || TAG_COLORS[0];
                          onCreateTag?.(newTagName.trim(), colorObj.colorClass);
                          setIsCreatingTag(false);
                          setNewTagName("");
                        }
                        if (e.key === "Escape") {
                          setIsCreatingTag(false);
                          setNewTagName("");
                        }
                      }}
                    />
                  </div>

                  {/* Color Field — dropdown swatch selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Color
                    </label>
                    <div className="relative" ref={colorDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setColorDropdownOpen((o) => !o)}
                        className="w-full flex items-center justify-between gap-2 px-3 py-1.5 border border-border rounded-lg bg-background text-sm font-medium cursor-pointer hover:bg-accent/30 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "w-4 h-4 rounded",
                              TAG_COLORS.find((c) => c.value === newTagColor)?.colorClass ?? "bg-blue-500"
                            )}
                          />
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      {colorDropdownOpen && (
                        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                          {TAG_COLORS.map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => {
                                setNewTagColor(c.value);
                                setColorDropdownOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium hover:bg-accent/50 transition-colors text-left",
                                newTagColor === c.value && "bg-accent/30"
                              )}
                            >
                              <span className={cn("w-3.5 h-3.5 rounded shrink-0", c.colorClass)} />
                              <span>{c.label}</span>
                              {newTagColor === c.value && <Check className="h-3 w-3 ml-auto text-[#A855F7]" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingTag(false);
                        setNewTagName("");
                        setColorDropdownOpen(false);
                      }}
                      className="text-xs text-[#A855F7] font-semibold hover:underline cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (newTagName.trim()) {
                          const colorObj = TAG_COLORS.find((c) => c.value === newTagColor) || TAG_COLORS[0];
                          onCreateTag?.(newTagName.trim(), colorObj.colorClass);
                          setIsCreatingTag(false);
                          setNewTagName("");
                          setColorDropdownOpen(false);
                        }
                      }}
                      disabled={!newTagName.trim()}
                      className="px-4 py-1.5 text-xs bg-[#A855F7] text-white rounded-lg hover:bg-[#A855F7]/90 disabled:opacity-40 font-semibold cursor-pointer transition-colors shadow-sm"
                    >
                      Create
                    </button>
                  </div>
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Type Filter (Flat trigger) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 py-1.5 px-2.5 text-sm font-semibold hover:bg-accent/50 rounded-lg transition-colors cursor-pointer outline-none text-muted-foreground hover:text-foreground">
              <GroupFolderIcon className="h-4.5 w-4.5" />
              <span className="hidden sm:inline">Type</span>
              {typeFilter !== "all" && <span className="sm:hidden text-[10px] text-[#A855F7] font-bold">*</span>}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => setTypeFilter("all")} className="justify-between cursor-pointer">
              <span>All Types</span>
              {typeFilter === "all" && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter("folder")} className="justify-between cursor-pointer">
              <span>Folders</span>
              {typeFilter === "folder" && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter("document")} className="justify-between cursor-pointer">
              <span>Documents</span>
              {typeFilter === "document" && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter("image")} className="justify-between cursor-pointer">
              <span>Images</span>
              {typeFilter === "image" && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter("video")} className="justify-between cursor-pointer">
              <span>Videos</span>
              {typeFilter === "video" && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter("audio")} className="justify-between cursor-pointer">
              <span>Audio</span>
              {typeFilter === "audio" && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter("pdf")} className="justify-between cursor-pointer">
              <span>PDFs</span>
              {typeFilter === "pdf" && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Modified Filter (Flat trigger) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 py-1.5 px-2.5 text-sm font-semibold hover:bg-accent/50 rounded-lg transition-colors cursor-pointer outline-none text-muted-foreground hover:text-foreground">
              <ModifiedIcon className="h-4.5 w-4.5" />
              <span className="hidden sm:inline">Modified</span>
              {dateFilter !== "all" && <span className="sm:hidden text-[10px] text-[#A855F7] font-bold">*</span>}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => setDateFilter("all")} className="justify-between cursor-pointer">
              <span>Any Time</span>
              {dateFilter === "all" && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter("today")} className="justify-between cursor-pointer">
              <span>Today</span>
              {dateFilter === "today" && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter("7days")} className="justify-between cursor-pointer">
              <span>Last 7 Days</span>
              {dateFilter === "7days" && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDateFilter("30days")} className="justify-between cursor-pointer">
              <span>Last 30 Days</span>
              {dateFilter === "30days" && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* People Filter (Flat trigger) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 py-1.5 px-2.5 text-sm font-semibold hover:bg-accent/50 rounded-lg transition-colors cursor-pointer outline-none text-muted-foreground hover:text-foreground">
              <PeopleIcon className="h-4.5 w-4.5" />
              <span className="hidden sm:inline">People</span>
              {peopleFilter !== "all" && <span className="sm:hidden text-[10px] text-[#A855F7] font-bold">*</span>}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => setPeopleFilter("all")} className="justify-between cursor-pointer">
              <span>Everyone</span>
              {peopleFilter === "all" && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPeopleFilter("mine")} className="justify-between cursor-pointer">
              <span>Owned by me</span>
              {peopleFilter === "mine" && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPeopleFilter("shared")} className="justify-between cursor-pointer">
              <span>Shared with me</span>
              {peopleFilter === "shared" && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Bulk Delete button (conditionally showing when selections exist) */}
        {selectedCount > 0 && (
          <button
            onClick={onDeleteSelected}
            className="flex items-center gap-2 h-8 px-4 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-semibold transition-colors cursor-pointer outline-none shadow-sm"
          >
            Delete {selectedCount}
          </button>
        )}
      </div>

      {/* Right: Search Input + Filter Toggle */}
      <div className="flex items-center gap-4 flex-1 md:flex-initial justify-end">
        {/* Layout Grid/List toggle */}
        <button
          onClick={() => setFileViewMode(fileViewMode === "list" ? "grid" : "list")}
          className="flex items-center justify-center h-9 w-9 hover:bg-accent/50 text-[#4A5568] hover:text-foreground rounded-lg transition-colors cursor-pointer outline-none"
          title={fileViewMode === "list" ? "Grid view" : "List view"}
        >
          {fileViewMode === "list" ? (
            <GridViewIcon className="h-5 w-5" />
          ) : (
            <List className="h-5 w-5" />
          )}
        </button>

        {/* Search Field */}
        <div className="relative w-full sm:max-w-[280px] flex-1 sm:flex-initial">
          <Search1Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[16px] text-[#7E7E7E] pointer-events-none" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-[38px] pr-8 rounded-[10px] border border-[#E2E8F0] text-sm bg-[#F8FAFC] focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all placeholder-[#A0AEC0] text-foreground"
          />
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7E7E7E] hover:text-foreground transition-colors outline-none flex items-center justify-center"
          >
            <CutIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filter Toggle / Reset */}
        <button
          onClick={hasActiveFilters ? clearAllFilters : undefined}
          className={cn(
            "flex items-center gap-2 h-9 px-3.5 border rounded-lg text-sm font-semibold transition-colors outline-none",
            hasActiveFilters
              ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 cursor-pointer"
              : "bg-card text-muted-foreground border-input cursor-default hover:bg-accent/20"
          )}
        >
          <FilterIcon className="h-4 w-4" />
          <span>Filter</span>
        </button>
      </div>
    </div>
  );
}

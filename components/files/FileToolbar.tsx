"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  File,
  Calendar,
  Users,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  fileViewMode,
  setFileViewMode,
  isAllSelected,
  onToggleSelectAll,
}: FileToolbarProps) {
  const hasActiveFilters =
    typeFilter !== "all" ||
    dateFilter !== "all" ||
    peopleFilter !== "all" ||
    searchQuery !== "";

  const clearAllFilters = () => {
    setTypeFilter("all");
    setDateFilter("all");
    setPeopleFilter("all");
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

        {/* Type Filter (Flat trigger) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 py-1.5 px-2.5 text-sm font-semibold hover:bg-accent/50 rounded-lg transition-colors cursor-pointer outline-none text-muted-foreground hover:text-foreground">
              <File className="h-4.5 w-4.5" />
              <span>Type</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
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
              <Calendar className="h-4.5 w-4.5" />
              <span>Modified</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
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
              <Users className="h-4.5 w-4.5" />
              <span>People</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
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

        {/* Layout Grid/List toggle (Flat trigger) */}
        <button
          onClick={() => setFileViewMode(fileViewMode === "list" ? "grid" : "list")}
          className="flex items-center justify-center h-8 w-8 hover:bg-accent/50 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer outline-none"
          title={fileViewMode === "list" ? "Grid view" : "List view"}
        >
          {fileViewMode === "list" ? (
            <LayoutGrid className="h-4.5 w-4.5" />
          ) : (
            <List className="h-4.5 w-4.5" />
          )}
        </button>

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
        {/* Search Field */}
        <div className="relative w-full max-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-8 rounded-full border-none text-sm bg-muted/65 focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all placeholder-muted-foreground/60 text-foreground"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-sm font-semibold outline-none"
            >
              ×
            </button>
          )}
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
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filter</span>
        </button>
      </div>
    </div>
  );
}

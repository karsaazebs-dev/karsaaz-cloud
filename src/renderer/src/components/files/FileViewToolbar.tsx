import { ChevronDown, LayoutGrid, List } from 'lucide-react'
import type { SortOption } from '../../types/files'

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Newest First',
  oldest: 'Oldest First',
  'name-asc': 'Name A-Z',
  'name-desc': 'Name Z-A',
  size: 'Size'
}

interface FileViewToolbarProps {
  viewGrid: boolean
  onViewChange: (grid: boolean) => void
  sort: SortOption
  onSortChange: (sort: SortOption) => void
  sortOpen: boolean
  onSortOpenChange: (open: boolean) => void
}

export default function FileViewToolbar({
  viewGrid,
  onViewChange,
  sort,
  onSortChange,
  sortOpen,
  onSortOpenChange
}: FileViewToolbarProps): JSX.Element {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <button
          onClick={() => onSortOpenChange(!sortOpen)}
          className="flex items-center gap-2 rounded-[8px] border border-[#e5e5e5] bg-white px-3 py-2"
        >
          <span className="font-display text-[13px] font-semibold text-black">{SORT_LABELS[sort]}</span>
          <ChevronDown className="h-3.5 w-3.5 text-[#6b7280]" />
        </button>
        {sortOpen && (
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-[8px] border border-[#e5e5e5] bg-white py-1 shadow-lg">
            {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
              <button
                key={key}
                onClick={() => { onSortChange(key); onSortOpenChange(false) }}
                className={`flex w-full px-4 py-2 text-left font-display text-[13px] hover:bg-[#f5f5f7] ${
                  sort === key ? 'font-semibold text-[#2b7fff]' : 'text-[#09090b]'
                }`}
              >
                {SORT_LABELS[key]}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-1 rounded-[8px] bg-[#e5e5e5] p-1">
        <button
          onClick={() => onViewChange(true)}
          className={`flex items-center justify-center rounded-[4px] p-1.5 ${viewGrid ? 'bg-white shadow-[0px_1px_1px_rgba(0,0,0,0.1)]' : ''}`}
        >
          <LayoutGrid className="h-4 w-4 text-[#6b7280]" />
        </button>
        <button
          onClick={() => onViewChange(false)}
          className={`flex items-center justify-center rounded-[4px] p-1.5 ${!viewGrid ? 'bg-white shadow-[0px_1px_1px_rgba(0,0,0,0.1)]' : ''}`}
        >
          <List className="h-4 w-4 text-[#6b7280]" />
        </button>
      </div>
    </div>
  )
}

const TABS = ['All Files', 'Photos', 'Documents', 'Videos', 'Others']
const DOT_COLORS = ['#2b7fff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

interface FilterTabsProps {
  activeTab: number
  counts: string[]
  onChange: (index: number) => void
}

export default function FilterTabs({ activeTab, counts, onChange }: FilterTabsProps): JSX.Element {
  return (
    <div className="flex gap-[3px]">
      {TABS.map((label, i) => (
        <button
          key={label}
          onClick={() => onChange(i)}
          className={`flex items-center gap-2.5 rounded-[30px] border px-4 py-2.5 transition-all ${
            activeTab === i
              ? 'border-[#2b7fff] bg-[#2b7fff] shadow-[0px_4px_4px_rgba(43,127,255,0.3)]'
              : 'border-[#e5e5e5] bg-white'
          }`}
        >
          <div
            className="h-2 w-2 rounded-full"
            style={{ background: activeTab === i ? 'rgba(255,255,255,0.8)' : DOT_COLORS[i] }}
          />
          <span className={`font-display text-[14px] font-semibold ${activeTab === i ? 'text-white' : 'text-[#09090b]'}`}>
            {label}
          </span>
          <span className={`font-display text-[13px] ${activeTab === i ? 'text-[rgba(255,255,255,0.7)]' : 'text-[#71717b]'}`}>
            {counts[i] ?? '0'}
          </span>
        </button>
      ))}
    </div>
  )
}

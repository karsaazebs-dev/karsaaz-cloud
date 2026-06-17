const imgEllipse4 = 'https://www.figma.com/api/mcp/asset/c7530330-df26-4070-bbd8-ef98842ee9b8'
const imgEllipse5 = 'https://www.figma.com/api/mcp/asset/07759c2d-35c8-467c-af02-d77d8a81a03e'
const imgEllipse6 = 'https://www.figma.com/api/mcp/asset/9b7993b7-cc61-4b0f-a805-41df9be013da'
const imgEllipse7 = 'https://www.figma.com/api/mcp/asset/cea6ebfa-65fd-4a20-8038-1b34683da47b'

const TABS = ['All Files', 'Photos', 'Documents', 'Videos', 'Others']

interface FilterTabsProps {
  activeTab: number
  counts: string[]
  onChange: (index: number) => void
}

export default function FilterTabs({ activeTab, counts, onChange }: FilterTabsProps): JSX.Element {
  const dots = [imgEllipse4, imgEllipse5, imgEllipse5, imgEllipse6, imgEllipse7]

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
          <img alt="" className="h-2 w-2" src={dots[i]} />
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

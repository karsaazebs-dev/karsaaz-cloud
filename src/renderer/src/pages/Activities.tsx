import { MOCK_ACTIVITIES } from '../data/mockFiles'

const ACTION_ICONS: Record<string, string> = {
  upload: '⬆️',
  share: '🔗',
  delete: '🗑️',
  edit: '✏️',
  other: '📋'
}

export default function Activities(): JSX.Element {
  const grouped = MOCK_ACTIVITIES.reduce<Record<string, typeof MOCK_ACTIVITIES>>((acc, entry) => {
    const key = entry.timestamp.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    if (!acc[key]) acc[key] = []
    acc[key].push(entry)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-display text-[20px] font-bold text-[#09090b]">Activities</h2>

      {Object.entries(grouped).map(([date, entries]) => (
        <div key={date} className="flex flex-col gap-3">
          <p className="font-display text-[13px] font-semibold text-[#71717b]">{date}</p>
          {entries.map((e) => (
            <div key={e.id} className="flex items-start gap-3 rounded-[12px] bg-white p-4 shadow-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-lg">
                {ACTION_ICONS[e.type] ?? '📋'}
              </div>
              <div className="flex-1">
                <p className="font-display text-[14px] text-[#09090b]">
                  <span className="font-semibold">{e.user}</span> {e.action}{' '}
                  <span className="font-semibold text-[#2b7fff]">{e.target}</span>
                </p>
                <p className="font-display text-[12px] text-[#71717b]">
                  {e.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

import type { MonthActivity } from '../../utils/fileStats'

interface UploadActivityChartProps {
  data: MonthActivity[]
}

export default function UploadActivityChart({ data }: UploadActivityChartProps): JSX.Element {
  const max = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="flex flex-1 flex-col gap-6 rounded-[16px] bg-white p-6 shadow-[0px_4px_6px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between">
        <p className="font-display text-[16px] font-bold text-[#09090b]">Upload Activity</p>
        <p className="font-display text-[13px] font-medium text-[#71717b]">Last 6 Months</p>
      </div>
      <div className="flex h-[180px] items-end gap-4 px-2">
        {data.map((month) => (
          <div key={month.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-[140px] w-full items-end justify-center">
              <div
                className="w-full max-w-[48px] rounded-t-[6px] bg-[#0d9488] transition-all"
                style={{ height: `${Math.max(8, (month.count / max) * 100)}%` }}
                title={`${month.count} file${month.count === 1 ? '' : 's'}`}
              />
            </div>
            <span className="font-display text-[12px] font-medium text-[#71717b]">{month.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

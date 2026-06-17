interface PaginationDotsProps {
  total: number
  active: number
}

export default function PaginationDots({ total, active }: PaginationDotsProps): JSX.Element {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-[4px] transition-all duration-200 ${
            i === active
              ? 'w-6 bg-[#3d7bff]'
              : 'w-2 bg-[#d1d5db]'
          }`}
        />
      ))}
    </div>
  )
}

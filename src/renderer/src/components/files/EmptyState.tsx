interface EmptyStateProps {
  message: string
  cta?: string
  onCta?: () => void
}

export default function EmptyState({ message, cta, onCta }: EmptyStateProps): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-[16px] bg-white py-20 shadow-[0px_4px_6px_rgba(0,0,0,0.03)]">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#eff6ff] text-4xl">
        📂
      </div>
      <p className="font-display text-[16px] font-semibold text-[#09090b]">{message}</p>
      <p className="font-display text-[13px] text-[#71717b]">Drag and drop files here to upload</p>
      {cta && onCta && (
        <button
          onClick={onCta}
          className="mt-2 rounded-[8px] bg-[#2b7fff] px-6 py-2.5 font-display text-[14px] font-semibold text-white hover:bg-[#1a6fe8]"
        >
          {cta}
        </button>
      )}
    </div>
  )
}

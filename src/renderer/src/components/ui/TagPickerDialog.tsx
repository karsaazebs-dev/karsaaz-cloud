import { useEffect, useState } from 'react'
import { Tag as TagIcon } from 'lucide-react'
import { listSystemTags, type SystemTag } from '../../services/tagsApi'

interface TagPickerDialogProps {
  onSelect: (tagName: string) => void
  onCancel: () => void
}

export default function TagPickerDialog({ onSelect, onCancel }: TagPickerDialogProps): JSX.Element {
  const [tags, setTags] = useState<SystemTag[]>([])
  const [loading, setLoading] = useState(true)
  const [newTag, setNewTag] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    listSystemTags()
      .then(setTags)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div
        className="flex w-full max-w-md flex-col rounded-[16px] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[#e5e5e5] px-6 py-4">
          <h3 className="font-display text-[18px] font-bold text-[#09090b]">Add tag</h3>
          <p className="mt-1 font-display text-[13px] text-[#71717b]">Choose an existing tag or create a new one</p>
        </div>

        <div className="max-h-[280px] overflow-y-auto px-2 py-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2b7fff] border-t-transparent" />
            </div>
          ) : tags.length === 0 ? (
            <p className="py-6 text-center font-display text-[13px] text-[#71717b]">No tags yet — create one below</p>
          ) : (
            tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => onSelect(tag.name)}
                className="flex w-full items-center gap-3 rounded-[8px] px-4 py-2.5 text-left hover:bg-[#f5f5f7]"
              >
                <TagIcon className="h-4 w-4 text-[#6b7280]" />
                <span className="font-display text-[14px] text-[#09090b]">{tag.name}</span>
              </button>
            ))
          )}
        </div>

        <div className="border-t border-[#e5e5e5] px-6 py-4">
          {creating ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="New tag name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTag.trim()) onSelect(newTag.trim())
                }}
                className="flex-1 rounded-[8px] border border-[#e5e5e5] px-3 py-2 font-display text-[13px] outline-none focus:border-[#2b7fff]"
              />
              <button
                type="button"
                disabled={!newTag.trim()}
                onClick={() => onSelect(newTag.trim())}
                className="rounded-[8px] bg-[#2b7fff] px-3 py-2 font-display text-[12px] font-semibold text-white disabled:opacity-50"
              >
                Add
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="font-display text-[13px] font-semibold text-[#2b7fff] hover:opacity-80"
            >
              + Create new tag
            </button>
          )}
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={onCancel} className="rounded-[8px] px-4 py-2 font-display text-[13px] font-semibold text-[#71717b] hover:bg-[#f3f4f6]">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

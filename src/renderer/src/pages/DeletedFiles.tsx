import { useState } from 'react'

const DELETED_FILES = [
  { id: 't1', name: 'Old_Draft.docx', size: '2.1 MB', deletedAt: '3 days ago', expiresIn: '27 days' },
  { id: 't2', name: 'Screenshot_2024.png', size: '450 KB', deletedAt: '1 week ago', expiresIn: '23 days' },
  { id: 't3', name: 'Archive.zip', size: '45 MB', deletedAt: '2 weeks ago', expiresIn: '16 days' }
]

export default function DeletedFiles(): JSX.Element {
  const [files, setFiles] = useState(DELETED_FILES)

  const restore = (id: string): void => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const permanentDelete = (id: string): void => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const emptyTrash = (): void => setFiles([])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[20px] font-bold text-[#09090b]">Deleted Files</h2>
        {files.length > 0 && (
          <button
            onClick={emptyTrash}
            className="rounded-[8px] border border-[#ef4444] px-4 py-2 font-display text-[13px] font-semibold text-[#ef4444]"
          >
            Empty Trash
          </button>
        )}
      </div>

      {files.length === 0 ? (
        <div className="rounded-[16px] bg-white py-16 text-center shadow-sm">
          <p className="font-display text-[15px] text-[#71717b]">Trash is empty</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {files.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-[12px] bg-white p-4 shadow-sm">
              <div>
                <p className="font-display text-[14px] font-semibold text-[#09090b]">{f.name}</p>
                <p className="font-display text-[12px] text-[#71717b]">{f.size} • Deleted {f.deletedAt} • Expires in {f.expiresIn}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => restore(f.id)} className="rounded-[6px] bg-[#2b7fff] px-3 py-1.5 text-[12px] text-white">Restore</button>
                <button onClick={() => permanentDelete(f.id)} className="rounded-[6px] border border-[#ef4444] px-3 py-1.5 text-[12px] text-[#ef4444]">Delete Forever</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import MoveFolderDialog from '../components/ui/MoveFolderDialog'
import TagPickerDialog from '../components/ui/TagPickerDialog'

interface PromptOptions {
  title: string
  label?: string
  defaultValue?: string
  placeholder?: string
  confirmLabel?: string
}

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  destructive?: boolean
}

type DialogState =
  | ({ type: 'prompt' } & PromptOptions)
  | ({ type: 'confirm' } & ConfirmOptions)

interface ActionDialogContextValue {
  prompt: (options: PromptOptions) => Promise<string | null>
  confirm: (options: ConfirmOptions) => Promise<boolean>
  selectFolder: () => Promise<string | null>
  pickMoveFolder: (excludePath?: string) => Promise<string | null>
  pickTag: () => Promise<string | null>
}

const ActionDialogContext = createContext<ActionDialogContextValue | null>(null)

export function ActionDialogProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, setState] = useState<DialogState | null>(null)
  const [input, setInput] = useState('')
  const [moveFolderOpen, setMoveFolderOpen] = useState(false)
  const [moveExclude, setMoveExclude] = useState<string | undefined>()
  const [showTagPicker, setShowTagPicker] = useState(false)
  const resolverRef = useRef<((value: unknown) => void) | null>(null)

  const finish = useCallback((value: unknown) => {
    resolverRef.current?.(value)
    resolverRef.current = null
    setState(null)
    setInput('')
    setMoveFolderOpen(false)
    setMoveExclude(undefined)
    setShowTagPicker(false)
  }, [])

  const prompt = useCallback((options: PromptOptions) => {
    setInput(options.defaultValue ?? '')
    setState({ type: 'prompt', ...options })
    return new Promise<string | null>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const confirm = useCallback((options: ConfirmOptions) => {
    setState({ type: 'confirm', ...options })
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const selectFolder = useCallback(async () => {
    return window.api.dialog.selectFolder()
  }, [])

  const pickMoveFolder = useCallback((excludePath?: string) => {
    setMoveExclude(excludePath)
    setMoveFolderOpen(true)
    return new Promise<string | null>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const pickTag = useCallback(() => {
    setShowTagPicker(true)
    return new Promise<string | null>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  return (
    <ActionDialogContext.Provider value={{ prompt, confirm, selectFolder, pickMoveFolder, pickTag }}>
      {children}
      {moveFolderOpen && (
        <MoveFolderDialog
          excludePath={moveExclude}
          onSelect={(path) => finish(path)}
          onCancel={() => finish(null)}
        />
      )}
      {showTagPicker && (
        <TagPickerDialog
          onSelect={(tag) => finish(tag)}
          onCancel={() => finish(null)}
        />
      )}
      {state?.type === 'prompt' && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40" onClick={() => finish(null)}>
          <div
            className="w-full max-w-md rounded-[16px] bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 font-display text-[18px] font-bold text-[#09090b]">{state.title}</h3>
            {state.label && (
              <label className="mb-1 block font-display text-[13px] text-[#71717b]">{state.label}</label>
            )}
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={state.placeholder}
              onKeyDown={(e) => {
                if (e.key === 'Enter') finish(input.trim() || null)
                if (e.key === 'Escape') finish(null)
              }}
              className="mb-5 w-full rounded-[10px] border border-[#e5e5e5] px-3 py-2.5 font-display text-[14px] outline-none focus:border-[#2b7fff]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => finish(null)}
                className="rounded-[8px] px-4 py-2 font-display text-[13px] font-semibold text-[#71717b] hover:bg-[#f3f4f6]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => finish(input.trim() || null)}
                className="rounded-[8px] bg-[#2b7fff] px-4 py-2 font-display text-[13px] font-semibold text-white hover:opacity-90"
              >
                {state.confirmLabel ?? 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
      {state?.type === 'confirm' && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40" onClick={() => finish(false)}>
          <div
            className="w-full max-w-md rounded-[16px] bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 font-display text-[18px] font-bold text-[#09090b]">{state.title}</h3>
            <p className="mb-5 font-display text-[14px] text-[#71717b]">{state.message}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => finish(false)}
                className="rounded-[8px] px-4 py-2 font-display text-[13px] font-semibold text-[#71717b] hover:bg-[#f3f4f6]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => finish(true)}
                className={`rounded-[8px] px-4 py-2 font-display text-[13px] font-semibold text-white hover:opacity-90 ${
                  state.destructive ? 'bg-[#dc2626]' : 'bg-[#2b7fff]'
                }`}
              >
                {state.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ActionDialogContext.Provider>
  )
}

export function useActionDialog(): ActionDialogContextValue {
  const ctx = useContext(ActionDialogContext)
  if (!ctx) throw new Error('useActionDialog must be used within ActionDialogProvider')
  return ctx
}

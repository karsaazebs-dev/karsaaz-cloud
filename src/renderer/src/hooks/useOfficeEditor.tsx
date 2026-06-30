import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { FileItem } from '../types/files'
import {
  createOfficeDocument,
  createTextDocument,
  isOfficeEditableName,
  isOfficeFileId,
  openDocumentEditor,
  type OfficeTemplateType
} from '../services/officeApi'
import OfficeEditor from '../components/office/OfficeEditor'

interface OfficeEditorState {
  url: string
  title: string
}

interface OfficeEditorContextValue {
  openFile: (file: FileItem) => Promise<void>
  createDocument: (folderPath: string, type: OfficeTemplateType, title?: string) => Promise<void>
  createText: (folderPath: string, title?: string) => Promise<void>
  close: () => void
}

const OfficeEditorContext = createContext<OfficeEditorContextValue | null>(null)

export function OfficeEditorProvider({
  children,
  onChanged
}: {
  children: ReactNode
  onChanged?: () => void
}): JSX.Element {
  const [editor, setEditor] = useState<OfficeEditorState | null>(null)

  const close = useCallback(() => {
    setEditor(null)
    onChanged?.()
    window.dispatchEvent(new CustomEvent('karsaaz:files-changed'))
  }, [onChanged])

  const openFile = useCallback(async (file: FileItem) => {
    if (!isOfficeFileId(file.id) && !isOfficeEditableName(file.name)) {
      throw new Error('This file type cannot be edited in Office')
    }
    const url = await openDocumentEditor(file.id)
    setEditor({ url, title: file.name })
  }, [])

  const createDocument = useCallback(async (
    folderPath: string,
    type: OfficeTemplateType,
    title?: string
  ) => {
    const url = await createOfficeDocument(folderPath, type, title ?? '')
    const label = title?.trim() || `New ${type}`
    setEditor({ url, title: label })
  }, [])

  const createText = useCallback(async (folderPath: string, title?: string) => {
    await createTextDocument(folderPath, title ?? 'New Text Document')
    onChanged?.()
    window.dispatchEvent(new CustomEvent('karsaaz:files-changed'))
  }, [onChanged])

  const value = useMemo(
    () => ({ openFile, createDocument, createText, close }),
    [openFile, createDocument, createText, close]
  )

  return (
    <OfficeEditorContext.Provider value={value}>
      {children}
      {editor && (
        <OfficeEditor url={editor.url} title={editor.title} onClose={close} />
      )}
    </OfficeEditorContext.Provider>
  )
}

export function useOfficeEditor(): OfficeEditorContextValue {
  const ctx = useContext(OfficeEditorContext)
  if (!ctx) throw new Error('useOfficeEditor must be used within OfficeEditorProvider')
  return ctx
}

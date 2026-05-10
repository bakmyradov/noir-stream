import { useContext } from 'react'
import { LibraryContext, type LibraryContextValue } from './LibraryContext'

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error('useLibrary must be used inside <LibraryProvider>')
  return ctx
}

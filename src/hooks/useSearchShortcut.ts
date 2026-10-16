import { useEffect, useEffectEvent } from 'react'

function isTextField(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  )
}

/** Calls `onTrigger` on `/` (when not typing in a field) or ⌘K / Ctrl+K. */
export function useSearchShortcut(onTrigger: () => void, enabled = true) {
  const trigger = useEffectEvent(onTrigger)

  useEffect(() => {
    if (!enabled) return
    function onKeyDown(e: KeyboardEvent) {
      const combo = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
      const slash =
        e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !isTextField(e.target)
      if (!combo && !slash) return
      e.preventDefault()
      trigger()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}

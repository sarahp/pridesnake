'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type SnakeSelection = {
  head: string | null
  color: string | null
  selectHead: (head: string, color: string) => void
}

const SnakeSelectionContext = createContext<SnakeSelection | null>(null)

export function SnakeSelectionProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, setPending] = useState<{ head: string; color: string } | null>(null)

  const head = pending?.head ?? searchParams.get('head')
  const color = pending?.color ?? searchParams.get('color')

  useEffect(() => {
    if (!pending) return
    if (
      searchParams.get('head') === pending.head &&
      searchParams.get('color') === pending.color
    ) {
      setPending(null)
    }
  }, [searchParams, pending])

  const selectHead = useCallback(
    (id: string, nextColor: string) => {
      setPending({ head: id, color: nextColor })

      const params = new URLSearchParams(searchParams.toString())
      params.set('head', id)
      params.set('color', nextColor)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const value = useMemo(
    () => ({ head, color, selectHead }),
    [head, color, selectHead],
  )

  return (
    <SnakeSelectionContext.Provider value={value}>{children}</SnakeSelectionContext.Provider>
  )
}

export function useSnakeSelection() {
  const context = useContext(SnakeSelectionContext)
  if (!context) {
    throw new Error('useSnakeSelection must be used within SnakeSelectionProvider')
  }
  return context
}

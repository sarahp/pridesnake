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
  style: string | null
  selectHead: (styleId: string) => void
}

const SnakeSelectionContext = createContext<SnakeSelection | null>(null)

export function SnakeSelectionProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, setPending] = useState<string | null>(null)

  const style = pending ?? searchParams.get('style')

  useEffect(() => {
    if (!pending) return
    if (searchParams.get('style') === pending) {
      setPending(null)
    }
  }, [searchParams, pending])

  const selectHead = useCallback(
    (styleId: string) => {
      setPending(styleId)

      const params = new URLSearchParams(searchParams.toString())
      params.set('style', styleId)
      params.delete('head')
      params.delete('color')
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const value = useMemo(() => ({ style, selectHead }), [style, selectHead])

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

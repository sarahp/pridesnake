'use client'

import useSWR from 'swr'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, Copy } from 'lucide-react'

import { buildSnakeApiPath, type SnakeInfo } from '@/lib/snake'
import { useSnakeSelection } from '@/components/snake-selection-provider'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function LiveSnakeInfo() {
  const searchParams = useSearchParams()
  const { style } = useSnakeSelection()
  const apiPath = useMemo(() => {
    const params = new URLSearchParams()
    if (style) {
      params.set('style', style)
    } else {
      const head = searchParams.get('head')
      const color = searchParams.get('color')
      if (head) params.set('head', head)
      if (color) params.set('color', color)
    }
    return buildSnakeApiPath(params)
  }, [style, searchParams])

  const { data, error, isLoading } = useSWR<SnakeInfo>(apiPath, fetcher, {
    refreshInterval: 15000,
  })
  const [copied, setCopied] = useState(false)

  const online = !error && !isLoading && !!data
  const status = isLoading ? 'connecting' : online ? 'online' : 'offline'
  const displayPath = apiPath.replace('/api/snake', '<this-site>/api/snake')

  function copyUrl() {
    const url = `${window.location.origin}${apiPath}`

    const showCopied = () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }

    const fallbackCopy = () => {
      const onCopy = (event: ClipboardEvent) => {
        event.preventDefault()
        event.clipboardData?.setData('text/plain', url)
        document.removeEventListener('copy', onCopy)
        showCopied()
      }

      document.addEventListener('copy', onCopy)
      const copied = document.execCommand('copy')
      document.removeEventListener('copy', onCopy)

      if (!copied) {
        const textarea = document.createElement('textarea')
        textarea.value = url
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'fixed'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        try {
          if (document.execCommand('copy')) showCopied()
        } finally {
          document.body.removeChild(textarea)
        }
      }
    }

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(showCopied).catch(fallbackCopy)
    } else {
      fallbackCopy()
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
          Server status
        </h3>
        <span className="flex items-center gap-2 font-mono text-sm">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              status === 'online'
                ? 'bg-chart-5'
                : status === 'connecting'
                  ? 'bg-chart-4'
                  : 'bg-destructive'
            } ${status === 'online' ? 'animate-pulse' : ''}`}
            aria-hidden
          />
          <span
            className={
              status === 'online'
                ? 'text-chart-5'
                : status === 'connecting'
                  ? 'text-chart-4'
                  : 'text-destructive'
            }
          >
            {status}
          </span>
        </span>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Your snake URL
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-secondary px-3 py-2 font-mono text-sm text-secondary-foreground">
              {displayPath}
            </code>
            <button
              type="button"
              onClick={copyUrl}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-2 font-mono text-sm text-primary-foreground transition-opacity hover:opacity-90"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            GET {apiPath} response
          </p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-secondary p-4 font-mono text-sm leading-relaxed text-secondary-foreground">
            {data
              ? JSON.stringify(data, null, 2)
              : isLoading
                ? 'Pinging the server…'
                : 'Could not reach the server.'}
          </pre>
        </div>
      </div>
    </div>
  )
}

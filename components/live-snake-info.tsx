'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

type SnakeInfo = {
  apiversion: string
  author: string
  color: string
  head: string
  tail: string
  version: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function LiveSnakeInfo() {
  const { data, error, isLoading } = useSWR<SnakeInfo>('/api/snake', fetcher, {
    refreshInterval: 15000,
  })
  const [copied, setCopied] = useState(false)

  const online = !error && !isLoading && !!data
  const status = isLoading ? 'connecting' : online ? 'online' : 'offline'

  async function copyUrl() {
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    await navigator.clipboard.writeText(`${base}/api/snake`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
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
              {'<this-site>'}/api/snake
            </code>
            <button
              type="button"
              onClick={copyUrl}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 font-mono text-sm text-primary-foreground transition-opacity hover:opacity-90"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            GET /api/snake response
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

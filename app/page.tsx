import Image from 'next/image'
import { Suspense } from 'react'
import { LiveSnakeInfo } from '@/components/live-snake-info'
import { HeadGallery } from '@/components/head-gallery'
import { SnakeSelectionProvider } from '@/components/snake-selection-provider'
import { prideHeadOptions } from '@/lib/snake'

const RAINBOW = ['#e40303', '#ff8c00', '#ffed00', '#008026', '#004dff', '#750787']

function RainbowBar() {
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full" aria-hidden>
      {RAINBOW.map((c) => (
        <span key={c} className="flex-1" style={{ backgroundColor: c }} />
      ))}
    </div>
  )
}

const endpoints = [
  { method: 'GET', path: '/api/snake', desc: 'Snake appearance & metadata' },
  { method: 'POST', path: '/api/snake/start', desc: 'Fires when a game begins' },
  { method: 'POST', path: '/api/snake/move', desc: 'Returns a move each turn' },
  { method: 'POST', path: '/api/snake/end', desc: 'Fires when a game ends' },
]

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-16 md:py-24">
      {/* Hero */}
      <header className="text-center">
        <div className="mx-auto mb-8 flex justify-center gap-3">
          {prideHeadOptions.map((head) => (
            <div
              key={head.id}
              className="size-14 overflow-hidden rounded-xl border border-border md:size-16"
            >
              <Image
                src={head.src || '/placeholder.svg'}
                alt=""
                width={64}
                height={64}
                className="size-full [image-rendering:pixelated]"
              />
            </div>
          ))}
        </div>
        <p className="font-mono text-sm uppercase tracking-[0.3em] text-accent">
          Battlesnake · Meetup Edition
        </p>
        <h1 className="mt-4 text-balance text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
          PrideSnake
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
          A gloriously queer Battlesnake server, hosted for the meetup. Point your board here, pick
          a pride-flag head, and let the smartest snake slither out on top.
        </p>
        <div className="mx-auto mt-10 max-w-sm">
          <RainbowBar />
        </div>
      </header>

      {/* Head gallery + live preview share selection state */}
      <Suspense
        fallback={
          <div className="mt-20 space-y-20">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {prideHeadOptions.map((head) => (
                <div
                  key={head.id}
                  className="h-64 animate-pulse rounded-2xl border border-border bg-card"
                />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
          </div>
        }
      >
        <SnakeSelectionProvider>
          <section className="mt-20" aria-labelledby="gallery-heading">
            <h2 id="gallery-heading" className="text-2xl font-bold tracking-tight md:text-3xl">
              Pick your pride head
            </h2>
            <p className="mt-2 text-muted-foreground">
              Tap a head to build your snake URL — the preview below updates instantly.
            </p>
            <div className="mt-6">
              <HeadGallery />
            </div>
          </section>

          <section className="mt-20" aria-labelledby="live-heading">
            <h2 id="live-heading" className="sr-only">
              Live server info
            </h2>
            <LiveSnakeInfo />
          </section>
        </SnakeSelectionProvider>
      </Suspense>

      {/* Endpoints */}
      <section className="mt-20" aria-labelledby="endpoints-heading">
        <h2 id="endpoints-heading" className="text-2xl font-bold tracking-tight md:text-3xl">
          The endpoints
        </h2>
        <p className="mt-2 text-muted-foreground">
          Standard Battlesnake API, served from Next.js route handlers.
        </p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-border">
          {endpoints.map((e, i) => (
            <div
              key={e.path}
              className={`flex flex-col gap-2 bg-card p-5 sm:flex-row sm:items-center sm:gap-6 ${
                i !== 0 ? 'border-t border-border' : ''
              }`}
            >
              <span
                className={`inline-flex w-fit shrink-0 items-center rounded-md px-2.5 py-1 font-mono text-xs font-semibold ${
                  e.method === 'GET'
                    ? 'bg-chart-3/20 text-chart-3'
                    : 'bg-primary/20 text-primary'
                }`}
              >
                {e.method}
              </span>
              <code className="font-mono text-sm text-card-foreground">{e.path}</code>
              <span className="text-sm text-muted-foreground sm:ml-auto">{e.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How to connect */}
      <section className="mt-20" aria-labelledby="connect-heading">
        <h2 id="connect-heading" className="text-2xl font-bold tracking-tight md:text-3xl">
          Play at the meetup
        </h2>
        <ol className="mt-6 space-y-4">
          {[
            'Sign in at play.battlesnake.com and create a new Battlesnake.',
            'Pick a head above, copy your snake URL, and paste it when creating your Battlesnake.',
            'Join the meetup arena or start a friendly game with the crew.',
            'Cheer as the pride-flag snakes battle for the top spot.',
          ].map((step, i) => (
            <li key={i} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-sm font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <p className="pt-1 leading-relaxed text-card-foreground">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="mt-20 flex flex-col items-center gap-6">
        <RainbowBar />
        <p className="text-center font-mono text-sm text-muted-foreground">
          Built with pride for the meetup · Happy slithering 🏳️‍🌈
        </p>
      </footer>
    </main>
  )
}

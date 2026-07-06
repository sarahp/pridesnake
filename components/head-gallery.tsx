'use client'

import Image from 'next/image'

import { prideHeadOptions } from '@/lib/snake'
import { useSnakeSelection } from '@/components/snake-selection-provider'

export function HeadGallery() {
  const { head: selectedHead, selectHead } = useSnakeSelection()

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {prideHeadOptions.map((head) => {
        const selected = selectedHead === head.id

        return (
          <button
            key={head.id}
            type="button"
            onClick={() => selectHead(head.id, head.color)}
            aria-pressed={selected}
            className={`group flex cursor-pointer flex-col items-center rounded-2xl border bg-card p-5 text-center transition-all hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              selected
                ? 'border-primary ring-2 ring-primary/30'
                : 'border-border hover:border-primary/40'
            }`}
          >
            <div className="overflow-hidden rounded-xl">
              <Image
                src={head.src || '/placeholder.svg'}
                alt={`${head.flag} pixel-art snake head`}
                width={200}
                height={200}
                className="size-full transition-transform duration-300 group-hover:scale-105 [image-rendering:pixelated]"
              />
            </div>
            <span className="mt-4 block">
              <span className="block font-semibold text-card-foreground">{head.name}</span>
              <span className="mt-1 block font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {head.flag}
              </span>
              {selected && (
                <span className="mt-2 block font-mono text-xs text-primary">Selected</span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

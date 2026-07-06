import Image from 'next/image'

const heads = [
  { src: '/heads/rainbow.png', name: 'Rainbow', flag: 'Classic Pride' },
  { src: '/heads/trans.png', name: 'Azure', flag: 'Trans Pride' },
  { src: '/heads/bi.png', name: 'Magenta', flag: 'Bi Pride' },
  { src: '/heads/lesbian.png', name: 'Sunset', flag: 'Lesbian Pride' },
]

export function HeadGallery() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {heads.map((head) => (
        <figure
          key={head.name}
          className="group flex flex-col items-center rounded-2xl border border-border bg-card p-5 text-center transition-transform hover:-translate-y-1"
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
          <figcaption className="mt-4">
            <p className="font-semibold text-card-foreground">{head.name}</p>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {head.flag}
            </p>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

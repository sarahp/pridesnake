// Battlesnake types + smart-survivor move logic.
// API reference: https://docs.battlesnake.com/api

export type Coord = { x: number; y: number }

export type Battlesnake = {
  id: string
  name: string
  health: number
  body: Coord[]
  head: Coord
  length: number
  latency?: string
  shout?: string
}

export type Board = {
  height: number
  width: number
  food: Coord[]
  hazards: Coord[]
  snakes: Battlesnake[]
}

export type GameState = {
  game: { id: string; timeout: number }
  turn: number
  board: Board
  you: Battlesnake
}

export type Direction = 'up' | 'down' | 'left' | 'right'

// The snake's identity card returned on GET /.
// Head/tail names come from Battlesnake's customization list.
export type SnakeInfo = {
  apiversion: string
  author: string
  color: string
  head: string
  tail: string
  version: string
}

export const snakeInfo: SnakeInfo = {
  apiversion: '1',
  author: 'SarahPeony',
  color: '#a855f7', // pride purple
  head: 'default',
  tail: 'rbc-necktie',
  version: '1.0.0-pride',
}

export type PrideHeadOption = {
  id: string
  src: string
  name: string
  flag: string
  color: string
}

// Gallery picks map to Battlesnake customization IDs from play.battlesnake.com/customizations.
export const prideHeadOptions: PrideHeadOption[] = [
  { id: 'pixel', src: '/heads/rainbow.png', name: 'Rainbow', flag: 'Classic Pride', color: '#750787' },
  {
    id: 'trans-rights-scarf',
    src: '/heads/trans.png',
    name: 'Azure',
    flag: 'Trans Pride',
    color: '#5BCEFA',
  },
  { id: 'smile', src: '/heads/bi.png', name: 'Magenta', flag: 'Bi Pride', color: '#D60270' },
  { id: 'rose', src: '/heads/lesbian.png', name: 'Sunset', flag: 'Lesbian Pride', color: '#D52D00' },
]

const CUSTOMIZATION_ID = /^[a-z0-9-]+$/
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

function customizationId(value: string | null): string | undefined {
  if (!value || !CUSTOMIZATION_ID.test(value)) return undefined
  return value
}

function hexColor(value: string | null): string | undefined {
  if (!value || !HEX_COLOR.test(value)) return undefined
  return value
}

export function buildSnakeQuery(searchParams: URLSearchParams): string {
  const params = new URLSearchParams()
  const head = customizationId(searchParams.get('head'))
  const tail = customizationId(searchParams.get('tail'))
  const color = hexColor(searchParams.get('color'))

  if (head) params.set('head', head)
  if (tail) params.set('tail', tail)
  if (color) params.set('color', color)

  const query = params.toString()
  return query ? `?${query}` : ''
}

export function buildSnakeApiPath(searchParams: URLSearchParams): string {
  return `/api/snake${buildSnakeQuery(searchParams)}`
}

// Override defaults with ?head=, ?tail=, and ?color= on the snake URL.
export function resolveSnakeInfo(searchParams: URLSearchParams): SnakeInfo {
  const head = customizationId(searchParams.get('head'))
  const tail = customizationId(searchParams.get('tail'))
  const color = hexColor(searchParams.get('color'))

  return {
    ...snakeInfo,
    ...(head && { head }),
    ...(tail && { tail }),
    ...(color && { color }),
  }
}

const MOVES: Record<Direction, Coord> = {
  up: { x: 0, y: 1 },
  down: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

function key(c: Coord) {
  return `${c.x},${c.y}`
}

function inBounds(c: Coord, board: Board) {
  return c.x >= 0 && c.x < board.width && c.y >= 0 && c.y < board.height
}

// All cells currently occupied by snake bodies. Tails are excluded because
// they move out of the way next turn (unless the snake just ate).
function occupiedCells(board: Board): Set<string> {
  const occupied = new Set<string>()
  for (const snake of board.snakes) {
    snake.body.forEach((segment, i) => {
      const isTail = i === snake.body.length - 1
      const ateThisTurn = snake.health === 100
      if (isTail && !ateThisTurn) return
      occupied.add(key(segment))
    })
  }
  return occupied
}

// Flood fill from a starting cell to estimate how much open space is
// reachable. Used to avoid moves that trap the snake in a dead end.
function reachableSpace(start: Coord, board: Board, blocked: Set<string>): number {
  if (!inBounds(start, board) || blocked.has(key(start))) return 0
  const seen = new Set<string>([key(start)])
  const queue: Coord[] = [start]
  let count = 0
  while (queue.length > 0) {
    const cell = queue.shift()!
    count++
    for (const dir of Object.values(MOVES)) {
      const next = { x: cell.x + dir.x, y: cell.y + dir.y }
      const k = key(next)
      if (!inBounds(next, board) || blocked.has(k) || seen.has(k)) continue
      seen.add(k)
      queue.push(next)
    }
  }
  return count
}

function distance(a: Coord, b: Coord) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

export function chooseMove(state: GameState): { move: Direction; shout: string } {
  const { you, board } = state
  const head = you.head
  const occupied = occupiedCells(board)

  // Heads of larger-or-equal enemy snakes threaten head-to-head collisions.
  const dangerHeads = new Set<string>()
  for (const snake of board.snakes) {
    if (snake.id === you.id) continue
    if (snake.length >= you.length) {
      for (const dir of Object.values(MOVES)) {
        dangerHeads.add(key({ x: snake.head.x + dir.x, y: snake.head.y + dir.y }))
      }
    }
  }

  type Candidate = { move: Direction; target: Coord; space: number; risky: boolean }
  const safe: Candidate[] = []

  for (const move of Object.keys(MOVES) as Direction[]) {
    const target = { x: head.x + MOVES[move].x, y: head.y + MOVES[move].y }
    if (!inBounds(target, board)) continue
    if (occupied.has(key(target))) continue

    const space = reachableSpace(target, board, occupied)
    // Need at least enough room for the body to not trap itself.
    if (space < Math.min(you.length, 4)) continue

    safe.push({ move, target, space, risky: dangerHeads.has(key(target)) })
  }

  // Nothing safe? Fall back to any in-bounds, non-body cell, then give up left.
  if (safe.length === 0) {
    for (const move of Object.keys(MOVES) as Direction[]) {
      const target = { x: head.x + MOVES[move].x, y: head.y + MOVES[move].y }
      if (inBounds(target, board) && !occupied.has(key(target))) {
        return { move, shout: 'Yikes! Tight squeeze 🏳️‍🌈' }
      }
    }
    return { move: 'up', shout: 'gg, it was fabulous while it lasted' }
  }

  // Prefer non-risky moves; among those, prefer the most open space.
  const preferred = safe.filter((c) => !c.risky)
  const pool = preferred.length > 0 ? preferred : safe

  // Hungry? Steer toward the closest food when health is getting low.
  const hungry = you.health < 40 || board.snakes.length > 1
  let best = pool[0]

  if (hungry && board.food.length > 0) {
    let bestScore = -Infinity
    for (const c of pool) {
      const nearestFood = board.food.reduce(
        (min, f) => Math.min(min, distance(c.target, f)),
        Infinity,
      )
      // Balance chasing food with keeping options open.
      const score = c.space * 2 - nearestFood * (you.health < 40 ? 3 : 1)
      if (score > bestScore) {
        bestScore = score
        best = c
      }
    }
  } else {
    // Otherwise just maximize breathing room.
    best = pool.reduce((a, b) => (b.space > a.space ? b : a), pool[0])
  }

  return { move: best.move, shout: 'slithering with pride 🏳️‍🌈' }
}

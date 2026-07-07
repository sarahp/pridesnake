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
  head: 'trans-rights-scarf',
  tail: 'default',
  version: '1.0.0-pride',
}

export const lesbianSnakeInfo: SnakeInfo = {
  ...snakeInfo,
  color: '#D52D00',
  head: 'trans-rights-scarf',
  version: '1.0.0-lesbian-aggressive',
}

export type PrideHeadOption = {
  id: string
  battlesnakeHead: string
  src: string
  name: string
  flag: string
  color: string
}

// Gallery PNGs are site previews. In-game, all flags use the unlocked trans-rights-scarf head
// with a flag-specific body color until more Battlesnake heads are unlocked.
export const prideHeadOptions: PrideHeadOption[] = [
  {
    id: 'rainbow',
    battlesnakeHead: 'trans-rights-scarf',
    src: '/heads/rainbow.png',
    name: 'Rainbow',
    flag: 'Classic Pride',
    color: '#750787',
  },
  {
    id: 'trans',
    battlesnakeHead: 'trans-rights-scarf',
    src: '/heads/trans.png',
    name: 'Azure',
    flag: 'Trans Pride',
    color: '#5BCEFA',
  },
  {
    id: 'bi',
    battlesnakeHead: 'trans-rights-scarf',
    src: '/heads/bi.png',
    name: 'Magenta',
    flag: 'Bi Pride',
    color: '#D60270',
  },
  {
    id: 'lesbian',
    battlesnakeHead: 'trans-rights-scarf',
    src: '/heads/lesbian.png',
    name: 'Sunset',
    flag: 'Lesbian Pride',
    color: '#D52D00',
  },
]

export function getPrideHeadOption(style: string | null): PrideHeadOption | undefined {
  if (!style) return undefined
  return prideHeadOptions.find((option) => option.id === style)
}

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

  const style = searchParams.get('style')
  const prideOption = getPrideHeadOption(style)
  if (prideOption) {
    params.set('head', prideOption.battlesnakeHead)
    params.set('color', prideOption.color)
  } else {
    const head = customizationId(searchParams.get('head'))
    const color = hexColor(searchParams.get('color'))
    if (head) params.set('head', head)
    if (color) params.set('color', color)
  }

  const tail = customizationId(searchParams.get('tail'))
  if (tail) params.set('tail', tail)

  const query = params.toString()
  return query ? `?${query}` : ''
}

export function buildSnakeApiPath(searchParams: URLSearchParams): string {
  const style = searchParams.get('style')
  // Battlesnake move requests don't carry ?style= — use a dedicated path for lesbian aggression.
  if (style === 'lesbian') {
    return '/api/snake/lesbian'
  }
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

function eatingAt(target: Coord, board: Board): boolean {
  return board.food.some((f) => f.x === target.x && f.y === target.y)
}

// Occupied cells after our move: tail vacates unless we eat on that cell.
function blockedAfterMove(
  you: Battlesnake,
  target: Coord,
  board: Board,
  baseOccupied: Set<string>,
): Set<string> {
  const blocked = new Set(baseOccupied)
  const tailKey = key(you.body[you.body.length - 1])

  if (eatingAt(target, board)) {
    blocked.add(tailKey)
  } else {
    blocked.delete(tailKey)
  }

  blocked.delete(key(target))
  return blocked
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

function bfsDistance(from: Coord, goal: Coord, board: Board, blocked: Set<string>): number | null {
  if (from.x === goal.x && from.y === goal.y) return 0
  const seen = new Set<string>([key(from)])
  const queue: { cell: Coord; dist: number }[] = [{ cell: from, dist: 0 }]
  while (queue.length > 0) {
    const { cell, dist } = queue.shift()!
    for (const dir of Object.values(MOVES)) {
      const next = { x: cell.x + dir.x, y: cell.y + dir.y }
      if (next.x === goal.x && next.y === goal.y) return dist + 1
      const k = key(next)
      if (!inBounds(next, board) || blocked.has(k) || seen.has(k)) continue
      seen.add(k)
      queue.push({ cell: next, dist: dist + 1 })
    }
  }
  return null
}

function canReach(from: Coord, goal: Coord, board: Board, blocked: Set<string>): boolean {
  return bfsDistance(from, goal, board, blocked) !== null
}

function nearestFoodPathDistance(from: Coord, board: Board, blocked: Set<string>): number | null {
  let best: number | null = null
  for (const food of board.food) {
    const dist = bfsDistance(from, food, board, blocked)
    if (dist !== null && (best === null || dist < best)) best = dist
  }
  return best
}

function bfsFoodScore(
  space: number,
  target: Coord,
  board: Board,
  blocked: Set<string>,
  foodWeight: number,
): number {
  const foodDist = nearestFoodPathDistance(target, board, blocked)
  return space * 2 - (foodDist ?? 999) * foodWeight + (eatingAt(target, board) ? 50 : 0)
}

function survivalFoodWeight(you: Battlesnake, board: Board): number {
  return you.health < 40 ? 4 : board.snakes.length > 1 ? 2 : 3
}

function maxEnemyLength(board: Board, youId: string): number {
  return board.snakes
    .filter((snake) => snake.id !== youId)
    .reduce((max, snake) => Math.max(max, snake.length), 0)
}

function possibleNextHeads(
  snake: Battlesnake,
  board: Board,
  occupied: Set<string>,
  hazards: Set<string>,
  aggressive: boolean,
): Coord[] {
  const heads: Coord[] = []
  for (const dir of Object.values(MOVES)) {
    const target = { x: snake.head.x + dir.x, y: snake.head.y + dir.y }
    if (!inBounds(target, board)) continue
    if (!canEnterCell(target, snake, board, occupied, hazards, aggressive)) continue
    heads.push(target)
  }
  return heads
}

function predictedEnemyNextHead(
  enemy: Battlesnake,
  state: GameState,
): Coord | null {
  const { move } = chooseMove({ ...state, you: enemy })
  return { x: enemy.head.x + MOVES[move].x, y: enemy.head.y + MOVES[move].y }
}

function headCollisionRisk(
  target: Coord,
  you: Battlesnake,
  board: Board,
  occupied: Set<string>,
  hazards: Set<string>,
  state: GameState,
): { predicted: boolean; possible: boolean } {
  const tk = key(target)
  let predicted = false
  let possible = false
  for (const snake of board.snakes) {
    if (snake.id === you.id || snake.length < you.length) continue
    const nextHead = predictedEnemyNextHead(snake, state)
    if (nextHead && key(nextHead) === tk) predicted = true
    for (const possibleHead of possibleNextHeads(snake, board, occupied, hazards, false)) {
      if (key(possibleHead) === tk) possible = true
    }
  }
  return { predicted, possible }
}

function blockedForCandidate(
  you: Battlesnake,
  target: Coord,
  board: Board,
  occupied: Set<string>,
  aggressive: boolean,
): Set<string> {
  const blocked = blockedAfterMove(you, target, board, occupied)
  if (aggressive && isKillHead(target, you, board)) {
    for (const snake of board.snakes) {
      if (snake.id === you.id || snake.length >= you.length) continue
      if (snake.head.x === target.x && snake.head.y === target.y) {
        blocked.delete(key(snake.head))
      }
    }
  }
  return blocked
}

function hazardCells(board: Board): Set<string> {
  return new Set(board.hazards.map(key))
}

// Head-to-head into a shorter enemy's head — we win.
function isKillHead(target: Coord, you: Battlesnake, board: Board): boolean {
  for (const snake of board.snakes) {
    if (snake.id === you.id) continue
    if (snake.length < you.length && snake.head.x === target.x && snake.head.y === target.y) {
      return true
    }
  }
  return false
}

function canEnterCell(
  target: Coord,
  you: Battlesnake,
  board: Board,
  occupied: Set<string>,
  hazards: Set<string>,
  aggressive: boolean,
): boolean {
  if (hazards.has(key(target))) return false
  if (aggressive && isKillHead(target, you, board)) return true
  return !occupied.has(key(target))
}

const LESBIAN_SHOUTS = {
  hunt: [
    'head-to-head? hold my girlfriend 💋',
    'shorter snake detected. die.',
    'orange you glad I\'m longer 🌅',
    'sapphic supremacy incoming',
  ],
  food: [
    'that apple is mine, babe 🍎',
    'food belongs to the gays',
    'nom with sapphic intent',
    'orange sunset hunger 🌅',
  ],
  squeeze: ['still fighting, still gay', 'tight squeeze but I\'m stubborn', 'not done yet, babe'],
  death: ['gg, kiss kiss 💋', 'death before dishonor 🏳️‍🌈', 'fabulous to the end'],
  default: [
    'aggressive lesbian energy 🏳️‍🌈',
    'sunset supremacy',
    'she/her/slay',
    'orange crush activated',
  ],
} as const

function lesbianShout(context: keyof typeof LESBIAN_SHOUTS): string {
  const pool = LESBIAN_SHOUTS[context]
  return pool[Math.floor(Math.random() * pool.length)]
}

export type ChooseMoveOptions = {
  aggressive?: boolean
}

export function chooseAggressiveMove(state: GameState): { move: Direction; shout: string } {
  return chooseMove(state, { aggressive: true })
}

export function chooseMove(
  state: GameState,
  options: ChooseMoveOptions = {},
): { move: Direction; shout: string } {
  const aggressive = options.aggressive ?? false
  const { you, board } = state
  const head = you.head
  const occupied = occupiedCells(board)
  const hazards = hazardCells(board)

  // Heads of larger-or-equal enemy snakes threaten head-to-head collisions.
  const dangerHeads = new Set<string>()
  for (const snake of board.snakes) {
    if (snake.id === you.id) continue
    if (snake.length >= you.length) {
      dangerHeads.add(key(snake.head))
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
    if (!canEnterCell(target, you, board, occupied, hazards, aggressive)) continue

    const blocked = blockedForCandidate(you, target, board, occupied, aggressive)
    const space = reachableSpace(target, board, blocked)
    if (space < you.length) continue

    safe.push({ move, target, space, risky: dangerHeads.has(key(target)) })
  }

  // Nothing safe? Prefer most space, then tail reachability, then any legal cell.
  if (safe.length === 0) {
    const tail = you.body[you.body.length - 1]
    type Fallback = { move: Direction; target: Coord; space: number; canReachTail: boolean }
    const fallback: Fallback[] = []

    for (const move of Object.keys(MOVES) as Direction[]) {
      const target = { x: head.x + MOVES[move].x, y: head.y + MOVES[move].y }
      if (!inBounds(target, board)) continue
      if (!canEnterCell(target, you, board, occupied, hazards, aggressive)) continue

      const blocked = blockedAfterMove(you, target, board, occupied)
      fallback.push({
        move,
        target,
        space: reachableSpace(target, board, blocked),
        canReachTail: canReach(target, tail, board, blocked),
      })
    }

    if (fallback.length > 0) {
      const maxSpace = Math.max(...fallback.map((f) => f.space))
      let pool = fallback.filter((f) => f.space === maxSpace)
      const tailReachable = pool.filter((f) => f.canReachTail)
      if (tailReachable.length > 0) pool = tailReachable
      return {
        move: pool[0].move,
        shout: aggressive ? lesbianShout('squeeze') : 'Yikes! Tight squeeze 🏳️‍🌈',
      }
    }

    return {
      move: 'up',
      shout: aggressive ? lesbianShout('death') : 'gg, it was fabulous while it lasted',
    }
  }

  const preferred = safe.filter((c) => !c.risky)
  const pool = preferred.length > 0 ? preferred : safe

  if (aggressive) {
    const maxEnemy = maxEnemyLength(board, you.id)
    const growPhase = you.length <= maxEnemy || state.turn < 20
    const huntPhase = you.length > maxEnemy

    // Grow phase: avoid equal-length head-to-head; hunt phase: take calculated risks.
    let aggressivePool = growPhase && preferred.length > 0 ? preferred : pool

    if (growPhase) {
      const collisionSafe = aggressivePool.filter((c) => {
        const risk = headCollisionRisk(c.target, you, board, occupied, hazards, state)
        return !risk.predicted
      })
      if (collisionSafe.length > 0) aggressivePool = collisionSafe
    }

    let best = aggressivePool[0]
    let bestScore = -Infinity
    let shoutContext: keyof typeof LESBIAN_SHOUTS = growPhase ? 'food' : 'default'

    const behind = you.length < maxEnemy
    const riskyPenalty = growPhase ? 200 : 40

    for (const c of aggressivePool) {
      const blocked = blockedForCandidate(you, c.target, board, occupied, true)
      let score: number

      if (growPhase && board.food.length > 0) {
        // Same BFS food pathfinding as Azure, but hungrier in early 1v1.
        const foodWeight =
          state.turn < 20 ? 4 : Math.max(survivalFoodWeight(you, board), 3)
        score = bfsFoodScore(c.space, c.target, board, blocked, foodWeight)
        if (
          eatingAt(c.target, board) ||
          (nearestFoodPathDistance(c.target, board, blocked) ?? 999) <= 2
        ) {
          shoutContext = 'food'
        }
      } else if (board.food.length > 0) {
        score = c.space * 0.5
        const foodDist = nearestFoodPathDistance(c.target, board, blocked)
        if (foodDist !== null) {
          score -= foodDist * 5
          if (foodDist <= 2) shoutContext = 'food'
        }
      } else {
        score = c.space * (growPhase ? 2 : 0.5)
      }

      if (huntPhase) {
        for (const snake of board.snakes) {
          if (snake.id === you.id || snake.length >= you.length) continue
          const preyDist = bfsDistance(c.target, snake.head, board, blocked)
          if (preyDist === null) continue
          score -= preyDist * 4
          if (c.target.x === snake.head.x && c.target.y === snake.head.y) {
            score += 120
            shoutContext = 'hunt'
          } else if (preyDist <= 2) {
            shoutContext = 'hunt'
          }
        }
      }

      if (c.risky) score -= riskyPenalty
      const collisionRisk = headCollisionRisk(c.target, you, board, occupied, hazards, state)
      if (collisionRisk.predicted) score -= 1000
      else if (collisionRisk.possible && growPhase) score -= 150
      else if (collisionRisk.possible && behind) score -= 250

      if (score > bestScore) {
        bestScore = score
        best = c
      }
    }

    return { move: best.move, shout: lesbianShout(shoutContext) }
  }

  // Pathfind to reachable food; fall back to maximizing open space.
  let best = pool[0]

  if (board.food.length > 0) {
    let bestScore = -Infinity
    const foodWeight = survivalFoodWeight(you, board)

    for (const c of pool) {
      const blocked = blockedAfterMove(you, c.target, board, occupied)
      const score = bfsFoodScore(c.space, c.target, board, blocked, foodWeight)
      if (score > bestScore) {
        bestScore = score
        best = c
      }
    }
  } else {
    best = pool.reduce((a, b) => (b.space > a.space ? b : a), pool[0])
  }

  return {
    move: best.move,
    shout: eatingAt(best.target, board) ? 'nom time 🏳️‍🌈' : 'slithering with pride 🏳️‍🌈',
  }
}

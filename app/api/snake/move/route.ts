import { NextResponse } from 'next/server'
import { chooseMove, type GameState } from '@/lib/snake'

// POST /api/snake/move — called every turn. Must respond quickly (within the
// game timeout) with the chosen direction.
export async function POST(request: Request) {
  const state = (await request.json()) as GameState
  const { move, shout } = chooseMove(state)
  return NextResponse.json({ move, shout })
}

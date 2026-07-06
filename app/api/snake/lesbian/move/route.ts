import { NextResponse } from 'next/server'
import { chooseAggressiveMove, type GameState } from '@/lib/snake'

// POST /api/snake/lesbian/move — aggressive lesbian move logic each turn.
export async function POST(request: Request) {
  const state = (await request.json()) as GameState
  const { move, shout } = chooseAggressiveMove(state)
  return NextResponse.json({ move, shout })
}

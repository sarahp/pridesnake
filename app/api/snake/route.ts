import { NextResponse } from 'next/server'
import { snakeInfo } from '@/lib/snake'

// GET /api/snake — Battlesnake reads this to register the snake's appearance.
export async function GET() {
  return NextResponse.json(snakeInfo)
}

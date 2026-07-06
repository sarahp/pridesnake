import { NextResponse } from 'next/server'
import { resolveSnakeInfo } from '@/lib/snake'

// GET /api/snake — Battlesnake reads this to register the snake's appearance.
// Optional query params: ?head=beluga&tail=curled&color=%23a855f7
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  return NextResponse.json(resolveSnakeInfo(searchParams))
}

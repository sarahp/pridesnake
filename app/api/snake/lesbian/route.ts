import { NextResponse } from 'next/server'
import { lesbianSnakeInfo } from '@/lib/snake'

// GET /api/snake/lesbian — aggressive lesbian snake identity card.
export async function GET() {
  return NextResponse.json(lesbianSnakeInfo)
}

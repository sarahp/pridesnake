import { NextResponse } from 'next/server'

// POST /api/snake/lesbian/end — called once when a game ends.
export async function POST() {
  return NextResponse.json({})
}

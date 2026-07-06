import { NextResponse } from 'next/server'

// POST /api/snake/end — called once when a game ends.
export async function POST() {
  return NextResponse.json({})
}

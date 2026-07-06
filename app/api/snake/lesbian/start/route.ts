import { NextResponse } from 'next/server'

// POST /api/snake/lesbian/start — called once when a game begins.
export async function POST() {
  return NextResponse.json({})
}

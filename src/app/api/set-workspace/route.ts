import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { path } = await request.json()
    process.env.WORKSPACE_PATH = path
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to set workspace path' }, { status: 500 })
  }
}
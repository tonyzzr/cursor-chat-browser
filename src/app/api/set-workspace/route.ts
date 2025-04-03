import { NextResponse } from 'next/server'
import { expandTildePath } from '@/utils/path'

export async function POST(request: Request) {
  try {
    const { path } = await request.json()
    const expandedPath = expandTildePath(path)
    process.env.WORKSPACE_PATH = expandedPath
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to set workspace path' }, { status: 500 })
  }
}
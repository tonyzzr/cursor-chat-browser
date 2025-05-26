import { NextResponse } from "next/server"
import path from 'path'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bubbleKey = searchParams.get('key')
    
    if (!bubbleKey) {
      return NextResponse.json({ error: 'Bubble key parameter required' }, { status: 400 })
    }

    // TEMPORARY HARDCODE: Testing if path is the issue
    const workspacePath = '/Users/zhuoruizhang/Library/Application Support/Cursor/User/workspaceStorage'
    const globalDbPath = path.join(workspacePath, '..', 'globalStorage', 'state.vscdb')
    
    console.log('Debug Bubble: Opening database at:', globalDbPath)

    const db = await open({
      filename: globalDbPath,
      driver: sqlite3.Database
    })

    // Get the specific bubble
    const bubble = await db.get(`
      SELECT [key], value FROM cursorDiskKV 
      WHERE [key] = ?
    `, [bubbleKey])

    await db.close()

    if (!bubble) {
      return NextResponse.json({ error: 'Bubble not found' }, { status: 404 })
    }

    const parsed = JSON.parse(bubble.value)
    
    return NextResponse.json({
      key: bubble.key,
      allKeys: Object.keys(parsed),
      text: parsed.text,
      richText: parsed.richText,
      type: parsed.type,
      codeBlocks: parsed.codeBlocks,
      toolResults: parsed.toolResults,
      capabilities: parsed.capabilities,
      isAgentic: parsed.isAgentic,
      // Include full raw data for debugging
      fullData: parsed
    })
  } catch (error) {
    console.error('Debug bubble endpoint error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
import { NextResponse } from "next/server"
import path from 'path'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

export async function GET() {
  try {
    // TEMPORARY HARDCODE: Testing if path is the issue
    const workspacePath = '/Users/zhuoruizhang/Library/Application Support/Cursor/User/workspaceStorage'
    const globalDbPath = path.join(workspacePath, '..', 'globalStorage', 'state.vscdb')
    
    console.log('Debug Global: Opening database at:', globalDbPath)
    console.log('Debug Global: Database exists:', require('fs').existsSync(globalDbPath))

    const db = await open({
      filename: globalDbPath,
      driver: sqlite3.Database
    })

    // Get all keys to see what's available
    const allKeys = await db.all(`SELECT [key] FROM cursorDiskKV LIMIT 50`)
    console.log('Debug Global: All available keys:', allKeys.map(row => row.key))

    // Look for chat-related keys
    const chatKeys = allKeys
      .map(row => row.key)
      .filter(key => key && key.toLowerCase().includes('chat') || key && key.toLowerCase().includes('aichat') || key && key.toLowerCase().includes('conversation'))
    
    console.log('Debug Global: Chat-related keys:', chatKeys)

    // Look for bubbleId keys (new storage format)
    const bubbleKeys = allKeys
      .map(row => row.key)
      .filter(key => key && key.startsWith('bubbleId:'))
      .slice(0, 5) // Just check first 5
    
    console.log('Debug Global: Found bubble keys:', bubbleKeys)

    // Check a few bubble entries
    let sampleData = []
    for (const key of bubbleKeys) {
      const result = await db.get(`SELECT value FROM cursorDiskKV WHERE [key] = ?`, [key])
      if (result) {
        try {
          const parsed = JSON.parse(result.value)
          sampleData.push({ 
            key, 
            dataKeys: typeof parsed === 'object' ? Object.keys(parsed) : 'not object',
            hasText: 'text' in parsed,
            hasType: 'type' in parsed,
            sample: typeof parsed === 'object' ? Object.keys(parsed).slice(0, 10) : parsed
          })
          console.log(`Debug Global: Bubble ${key} structure:`, Object.keys(parsed))
        } catch (e) {
          sampleData.push({ key, error: 'Failed to parse JSON' })
        }
      }
    }

    // Look for workspace information in bubble content
    let workspaceInfo = []
    for (const key of bubbleKeys.slice(0, 3)) {
      const result = await db.get(`SELECT value FROM cursorDiskKV WHERE [key] = ?`, [key])
      if (result) {
        try {
          const parsed = JSON.parse(result.value)
          workspaceInfo.push({ 
            key, 
            hasContext: 'context' in parsed,
            hasCurrentFileLocationData: 'currentFileLocationData' in parsed,
            hasAttachedFolders: 'attachedFolders' in parsed,
            hasAttachedFoldersNew: 'attachedFoldersNew' in parsed,
            contextKeys: parsed.context ? Object.keys(parsed.context) : null,
            currentFileLocationData: parsed.currentFileLocationData || null,
            attachedFolders: parsed.attachedFolders || null,
            attachedFoldersNew: parsed.attachedFoldersNew || null
          })
        } catch (e) {
          workspaceInfo.push({ key, error: 'Failed to parse JSON' })
        }
      }
    }

    await db.close()

    return NextResponse.json({
      globalDbPath,
      dbExists: require('fs').existsSync(globalDbPath),
      totalKeys: allKeys.length,
      allKeys: allKeys.map(row => row.key),
      chatKeys,
      bubbleKeys,
      sampleData,
      workspaceInfo
    })
  } catch (error) {
    console.error('Debug global endpoint error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
} 
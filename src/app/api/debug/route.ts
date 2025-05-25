import { NextResponse } from "next/server"
import path from 'path'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId parameter required' }, { status: 400 })
    }
    
    // TEMPORARY HARDCODE: Testing if path is the issue
    const workspacePath = '/Users/zhuoruizhang/Library/Application Support/Cursor/User/workspaceStorage'
    
    if (!workspacePath) {
      return NextResponse.json({ error: 'Workspace path not configured' }, { status: 400 })
    }
    
    const dbPath = path.join(workspacePath, workspaceId, 'state.vscdb')
    
    console.log('Debug: Opening database at:', dbPath)
    console.log('Debug: Database exists:', require('fs').existsSync(dbPath))

    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    })

    // Get all keys to see what's available
    const allKeys = await db.all(`SELECT [key] FROM ItemTable`)
    console.log('Debug: All available keys:', allKeys.map(row => row.key))

    // Get the chat data - try multiple possible keys
    const chatResult = await db.get(`
      SELECT value FROM ItemTable
      WHERE [key] = 'workbench.panel.aichat.view.aichat.chatdata'
    `)

    // Also check for UUID-based chat keys
    const uuidChatKeys = allKeys
      .map(row => row.key)
      .filter(key => key.startsWith('workbench.panel.aichat.') && key.includes('-') && !key.endsWith('.numberOfVisibleViews'))
    
    console.log('Debug: Found UUID-based chat keys:', uuidChatKeys)

    let uuidChatData = []
    for (const key of uuidChatKeys) {
      const result = await db.get(`SELECT value FROM ItemTable WHERE [key] = ?`, [key])
      if (result) {
        try {
          const parsed = JSON.parse(result.value)
          uuidChatData.push({ key, data: parsed })
          console.log(`Debug: UUID chat key ${key} has data:`, Object.keys(parsed))
        } catch (e) {
          console.log(`Debug: Failed to parse UUID chat key ${key}`)
        }
      }
    }

    let chatDataStructure = null
    if (chatResult) {
      const chatData = JSON.parse(chatResult.value)
      console.log('Debug: Full chat data keys:', Object.keys(chatData))
      
      if (chatData.tabs && chatData.tabs.length > 0) {
        const firstTab = chatData.tabs[0]
        console.log('Debug: First tab keys:', Object.keys(firstTab))
        console.log('Debug: First tab bubbles type:', typeof firstTab.bubbles)
        console.log('Debug: First tab bubbles length:', firstTab.bubbles?.length)
        console.log('Debug: First tab bubbles content:', firstTab.bubbles)
        
        if (firstTab.bubbles && firstTab.bubbles.length > 0) {
          console.log('Debug: First bubble keys:', Object.keys(firstTab.bubbles[0]))
          console.log('Debug: First bubble content:', firstTab.bubbles[0])
        }
        
        chatDataStructure = {
          tabsCount: chatData.tabs.length,
          firstTabKeys: Object.keys(firstTab),
          firstTabBubblesType: typeof firstTab.bubbles,
          firstTabBubblesLength: firstTab.bubbles?.length || 0,
          firstTabBubbles: firstTab.bubbles,
          firstBubble: firstTab.bubbles?.[0] || null
        }
      }
    }

    // Also check other potential data keys
    const otherDataKeys = ['notepadData', 'workbench.backgroundComposer.workspacePersistentData']
    let otherDataResults = []
    
    for (const key of otherDataKeys) {
      const result = await db.get(`SELECT value FROM ItemTable WHERE [key] = ?`, [key])
      if (result) {
        try {
          const parsed = JSON.parse(result.value)
          otherDataResults.push({ 
            key, 
            dataKeys: Object.keys(parsed),
            hasConversation: 'conversation' in parsed,
            hasBubbles: 'bubbles' in parsed,
            hasTabs: 'tabs' in parsed,
            sample: typeof parsed === 'object' ? Object.keys(parsed).slice(0, 5) : parsed
          })
          console.log(`Debug: ${key} structure:`, Object.keys(parsed))
        } catch (e) {
          console.log(`Debug: Failed to parse ${key}`)
        }
      }
    }

    await db.close()

    return NextResponse.json({
      dbPath,
      dbExists: require('fs').existsSync(dbPath),
      availableKeys: allKeys.map(row => row.key),
      chatDataExists: !!chatResult,
      chatDataStructure,
      rawChatValue: chatResult?.value ? JSON.parse(chatResult.value) : null,
      uuidChatKeys,
      uuidChatData,
      otherDataResults
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
} 
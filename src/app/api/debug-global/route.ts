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

    // Get ALL keys to see the full structure
    const allKeys = await db.all(`SELECT [key] FROM cursorDiskKV ORDER BY [key]`)
    console.log('Debug Global: Total keys found:', allKeys.length)

    // Categorize keys by type
    const keyCategories = {
      bubbleId: allKeys.filter(row => row.key && row.key.startsWith('bubbleId:')),
      composerData: allKeys.filter(row => row.key && row.key.startsWith('composerData:')),
      chat: allKeys.filter(row => row.key && row.key.toLowerCase().includes('chat')),
      conversation: allKeys.filter(row => row.key && row.key.toLowerCase().includes('conversation')),
      aichat: allKeys.filter(row => row.key && row.key.toLowerCase().includes('aichat')),
      other: allKeys.filter(row => 
        row.key &&
        !row.key.startsWith('bubbleId:') && 
        !row.key.startsWith('composerData:') &&
        !row.key.toLowerCase().includes('chat') &&
        !row.key.toLowerCase().includes('conversation')
      )
    }

    console.log('Key categories:', {
      bubbleId: keyCategories.bubbleId.length,
      composerData: keyCategories.composerData.length,
      chat: keyCategories.chat.length,
      conversation: keyCategories.conversation.length,
      aichat: keyCategories.aichat.length,
      other: keyCategories.other.length
    })

    // Look for the most recent bubbles (likely the active conversation)
    const recentBubbles = await db.all(`
      SELECT [key], value FROM cursorDiskKV 
      WHERE [key] LIKE 'bubbleId:%'
      ORDER BY rowid DESC
      LIMIT 20
    `)

    console.log('Found', recentBubbles.length, 'recent bubbles')

    // Analyze recent bubble structure and look for "React API Fetch Error Troubleshooting"
    let activeConversationData: any[] = []
    let conversationGroups = new Map<string, any[]>()
    
    for (const bubble of recentBubbles) {
      try {
        const parsed = JSON.parse(bubble.value)
        const keyParts = bubble.key.split(':')
        const chatId = keyParts[1]
        
        // Look for text content that might match our conversation
        const text = parsed.text || parsed.richText || ''
        const isRelevant = text.toLowerCase().includes('react') || 
                          text.toLowerCase().includes('api') || 
                          text.toLowerCase().includes('fetch') ||
                          text.toLowerCase().includes('error') ||
                          text.toLowerCase().includes('troubleshooting')
        
        const bubbleInfo = {
          key: bubble.key,
          chatId,
          type: parsed.type,
          isChat: parsed.isChat,
          text: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
          timestamp: parsed.timestamp || parsed.createdAt,
          isRelevant,
          allKeys: Object.keys(parsed),
          hasContext: 'context' in parsed,
          hasCurrentFileLocationData: 'currentFileLocationData' in parsed
        }
        
        activeConversationData.push(bubbleInfo)
        
        // Group by chat ID
        if (!conversationGroups.has(chatId)) {
          conversationGroups.set(chatId, [])
        }
        conversationGroups.get(chatId)?.push(bubbleInfo)
        
      } catch (e) {
        console.error('Failed to parse bubble:', bubble.key, e)
      }
    }

    // Find the most likely active conversation
    let mostLikelyActive = null
    let maxRelevantBubbles = 0
    
    for (const [chatId, bubbles] of Array.from(conversationGroups.entries())) {
      const relevantCount = bubbles.filter((b: any) => b.isRelevant).length
      if (relevantCount > maxRelevantBubbles) {
        maxRelevantBubbles = relevantCount
        mostLikelyActive = { chatId, bubbles, relevantCount }
      }
    }

    // Look for any keys that might indicate the current active chat
    const activeKeys = allKeys.filter(row => 
      row.key && (
        row.key.toLowerCase().includes('active') ||
        row.key.toLowerCase().includes('current') ||
        row.key.toLowerCase().includes('recent')
      )
    )

    let activeKeyData = []
    for (const key of activeKeys) {
      try {
        const result = await db.get(`SELECT value FROM cursorDiskKV WHERE [key] = ?`, [key.key])
        if (result) {
          const parsed = JSON.parse(result.value)
          activeKeyData.push({
            key: key.key,
            data: typeof parsed === 'object' ? Object.keys(parsed) : parsed,
            fullData: parsed
          })
        }
      } catch (e) {
        activeKeyData.push({ key: key.key, error: 'Failed to parse' })
      }
    }

    // Look for workspace-specific data that might help identify the current workspace
    const workspaceKeys = allKeys.filter(row => 
      row.key && (
        row.key.toLowerCase().includes('workspace') ||
        row.key.toLowerCase().includes('folder')
      )
    )

    let workspaceData = []
    for (const key of workspaceKeys.slice(0, 5)) {
      try {
        const result = await db.get(`SELECT value FROM cursorDiskKV WHERE [key] = ?`, [key.key])
        if (result) {
          const parsed = JSON.parse(result.value)
          workspaceData.push({
            key: key.key,
            data: parsed
          })
        }
      } catch (e) {
        workspaceData.push({ key: key.key, error: 'Failed to parse' })
      }
    }

    await db.close()

    return NextResponse.json({
      globalDbPath,
      dbExists: require('fs').existsSync(globalDbPath),
      totalKeys: allKeys.length,
      keyCategories: {
        bubbleId: keyCategories.bubbleId.length,
        composerData: keyCategories.composerData.length,
        chat: keyCategories.chat.length,
        conversation: keyCategories.conversation.length,
        aichat: keyCategories.aichat.length,
        other: keyCategories.other.length
      },
      sampleKeys: {
        bubbleId: keyCategories.bubbleId.slice(0, 10).map(k => k.key),
        composerData: keyCategories.composerData.slice(0, 5).map(k => k.key),
        chat: keyCategories.chat.map(k => k.key),
        other: keyCategories.other.slice(0, 10).map(k => k.key)
      },
      recentBubbles: activeConversationData,
             conversationGroups: Array.from(conversationGroups.entries()).map(([chatId, bubbles]) => ({
         chatId,
         bubbleCount: bubbles.length,
         relevantBubbles: bubbles.filter((b: any) => b.isRelevant).length,
         firstBubble: bubbles[0]?.text?.substring(0, 100),
         lastBubble: bubbles[bubbles.length - 1]?.text?.substring(0, 100)
       })),
      mostLikelyActive,
      activeKeys: activeKeyData,
      workspaceData
    })
  } catch (error) {
    console.error('Debug global endpoint error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
} 
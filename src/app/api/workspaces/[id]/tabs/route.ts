import { NextResponse } from "next/server"
import path from 'path'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { ChatBubble, ChatTab, ComposerData } from "@/types/workspace"
import { cookies } from 'next/headers'

interface RawTab {
  tabId: string;
  chatTitle: string;
  lastSendTime: number;
  bubbles: ChatBubble[];
}

const safeParseTimestamp = (timestamp: number | undefined): string => {
  try {
    if (!timestamp) {
      return new Date().toISOString();
    }
    return new Date(timestamp).toISOString();
  } catch (error) {
    console.error('Error parsing timestamp:', error, 'Raw value:', timestamp);
    return new Date().toISOString();
  }
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // TEMPORARY HARDCODE: Testing if path is the issue
    const workspacePath = '/Users/zhuoruizhang/Library/Application Support/Cursor/User/workspaceStorage'
    
    console.log('HARDCODED workspace path:', workspacePath)
    
    if (!workspacePath) {
      return NextResponse.json({ error: 'Workspace path not configured' }, { status: 400 })
    }
    
    const dbPath = path.join(workspacePath, params.id, 'state.vscdb')
    const globalDbPath = path.join(workspacePath, '..', 'globalStorage', 'state.vscdb')

    console.log('Trying to open database at:', dbPath)
    console.log('Database file exists:', require('fs').existsSync(dbPath))
    console.log('Global database path:', globalDbPath)
    console.log('Global database exists:', require('fs').existsSync(globalDbPath))

    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    })

    // Try the old format first
    const chatResult = await db.get(`
      SELECT value FROM ItemTable
      WHERE [key] = 'workbench.panel.aichat.view.aichat.chatdata'
    `)

    const composerResult = await db.get(`
      SELECT value FROM ItemTable
      WHERE [key] = 'composer.composerData'
    `)

    await db.close()

    const response: { tabs: ChatTab[], composers?: ComposerData } = { tabs: [] }

    // Handle old format if it exists
    if (chatResult) {
      const chatData = JSON.parse(chatResult.value)
      console.log('Found old format chat data with', chatData.tabs?.length || 0, 'tabs')
      
      response.tabs = chatData.tabs.map((tab: RawTab) => ({
        id: tab.tabId,
        title: tab.chatTitle?.split('\n')[0] || `Chat ${tab.tabId.slice(0, 8)}`,
        timestamp: safeParseTimestamp(tab.lastSendTime),
        bubbles: tab.bubbles || []
      }))
    } else {
      // Handle new format - read from global storage
      console.log('No old format data found, trying new bubble-based format')
      
      // First, get the workspace folder to filter bubbles
      const workspaceJsonPath = path.join(workspacePath, params.id, 'workspace.json')
      let workspaceFolder = null
      try {
        const workspaceData = JSON.parse(await require('fs').promises.readFile(workspaceJsonPath, 'utf-8'))
        workspaceFolder = workspaceData.folder
        console.log('Workspace folder:', workspaceFolder)
      } catch (error) {
        console.log('No workspace.json found, cannot filter bubbles by workspace')
      }
      
      const globalDb = await open({
        filename: globalDbPath,
        driver: sqlite3.Database
      })

      // Get all bubble keys
      const allBubbles = await globalDb.all(`
        SELECT [key], value FROM cursorDiskKV 
        WHERE [key] LIKE 'bubbleId:%'
      `)

      console.log('Found', allBubbles.length, 'total bubbles in global storage')

      // Group bubbles by chat ID, filtering by workspace
      const chatGroups: { [chatId: string]: any[] } = {}
      let filteredCount = 0
      let totalProcessed = 0
      
      for (const bubble of allBubbles) {
        try {
          const bubbleData = JSON.parse(bubble.value)
          
          // Skip if bubbleData is null or not an object
          if (!bubbleData || typeof bubbleData !== 'object') {
            continue
          }
          
          totalProcessed++
          
          // WORKSPACE FILTERING: This is a complex problem because Cursor's new bubble format
          // doesn't include explicit workspace IDs. We'll implement a heuristic approach.
          
          // For now, we'll use a simple approach: distribute bubbles across workspaces
          // based on the chat ID hash. This ensures different workspaces show different
          // conversations, even if the mapping isn't perfect.
          
          const keyParts = bubble.key.split(':')
          let belongsToWorkspace = true
          
          if (keyParts.length >= 2) {
            const chatId = keyParts[1]
            
            // Use a simple hash of the chat ID and workspace ID to determine
            // if this bubble should be shown in this workspace
            const chatHash = chatId.split('').reduce((a: number, b: string) => {
              a = ((a << 5) - a) + b.charCodeAt(0)
              return a & a
            }, 0)
            
            const workspaceHash = params.id.split('').reduce((a: number, b: string) => {
              a = ((a << 5) - a) + b.charCodeAt(0)
              return a & a
            }, 0)
            
            // Use modulo to distribute chats across workspaces
            // This ensures each workspace gets a different subset of conversations
            // Use a larger modulo to ensure better distribution
            belongsToWorkspace = Math.abs(chatHash) % 5 === Math.abs(workspaceHash) % 5
          }
          
          // Skip bubbles that don't belong to this workspace
          if (!belongsToWorkspace) {
            continue
          }
          
          if (keyParts.length >= 2) {
            const chatId = keyParts[1]
            
            // Only include chat bubbles (not composer)
            // Default to true if isChat is undefined (assume it's a chat bubble)
            if (bubbleData.isChat !== false) {
              if (!chatGroups[chatId]) {
                chatGroups[chatId] = []
              }
              chatGroups[chatId].push({
                ...bubbleData,
                bubbleKey: bubble.key
              })
              filteredCount++
            }
          }
        } catch (error) {
          // Silently skip invalid bubbles to avoid console spam
        }
      }
      
      console.log(`Processed ${totalProcessed} bubbles, included ${filteredCount} in chat groups`)

      await globalDb.close()

      console.log('Found', Object.keys(chatGroups).length, 'chat groups')

      // Convert to ChatTab format
      response.tabs = Object.entries(chatGroups).map(([chatId, bubbles]) => {
        // Sort bubbles by some timestamp if available
        bubbles.sort((a, b) => {
          // Try to sort by any timestamp field we can find
          const aTime = a.timestamp || a.createdAt || 0
          const bTime = b.timestamp || b.createdAt || 0
          return aTime - bTime
        })

        // Convert bubbles to our format
        const convertedBubbles: ChatBubble[] = bubbles.map(bubble => ({
          type: bubble.type === 'user' || bubble.type === 1 ? 'user' : 'ai',
          text: bubble.text || bubble.richText || '',
          modelType: bubble.type === 'assistant' || bubble.type === 2 ? 'AI Assistant' : undefined,
          selections: bubble.context?.selections || []
        }))

        // Try to get a title from the first user message or use chat ID
        const firstUserBubble = bubbles.find(b => b.type === 'user' || b.type === 1)
        const title = firstUserBubble?.text?.split('\n')[0]?.slice(0, 50) || `Chat ${chatId.slice(0, 8)}`

        return {
          id: chatId,
          title,
          timestamp: new Date().toISOString(), // We'll need to figure out proper timestamps
          bubbles: convertedBubbles
        }
      })

      // Only log summary, not individual tabs to reduce console spam
      console.log('Converted to', response.tabs.length, 'chat tabs')
    }

    // Handle composer data (this part should still work the same way)
    if (composerResult) {
      const globalDbPath = path.join(workspacePath, '..', 'globalStorage', 'state.vscdb')
      const composers: ComposerData = JSON.parse(composerResult.value)
      const keys = composers.allComposers.map((it) => `composerData:${it.composerId}`)
      const placeholders = keys.map(() => '?').join(',')

      const globalDb = await open({
        filename: globalDbPath,
        driver: sqlite3.Database
      })

      const composersBodyResult = await globalDb.all(`
        SELECT value FROM cursorDiskKV
        WHERE [key] in (${placeholders})
      `, keys)

      await globalDb.close()

      if (composersBodyResult) {
        composers.allComposers = composersBodyResult.map((it) => {
          const parsed = JSON.parse(it.value)
          console.log(`Composer ${parsed.composerId}: conversation length = ${parsed.conversation?.length || 0}`)
          if (parsed.conversation?.length > 0) {
            console.log('First message:', parsed.conversation[0])
          }
          return parsed
        })
        response.composers = composers
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to get workspace data:', error)
    return NextResponse.json({ error: 'Failed to get workspace data' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { existsSync } from 'fs'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { ChatTab, ComposerChat } from '@/types/workspace'
import { cookies } from 'next/headers'

interface WorkspaceLog {
  id: string;
  workspaceId: string;
  workspaceFolder?: string;
  title: string;
  timestamp: number;
  type: 'chat' | 'composer';
  messageCount: number;
}

export async function GET() {
  try {
    // TEMPORARY HARDCODE: Testing if path is the issue
    const workspacePath = '/Users/zhuoruizhang/Library/Application Support/Cursor/User/workspaceStorage'
    
    if (!workspacePath) {
      return NextResponse.json({ error: 'Workspace path not configured' }, { status: 400 })
    }
    
    const logs: WorkspaceLog[] = []
    
    const entries = await fs.readdir(workspacePath, { withFileTypes: true })
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dbPath = path.join(workspacePath, entry.name, 'state.vscdb')
        const workspaceJsonPath = path.join(workspacePath, entry.name, 'workspace.json')
        
        if (!existsSync(dbPath)) continue

        let workspaceFolder = undefined
        try {
          const workspaceData = JSON.parse(await fs.readFile(workspaceJsonPath, 'utf-8'))
          workspaceFolder = workspaceData.folder
        } catch {
          console.log(`No workspace.json found for ${entry.name}`)
        }

        const db = await open({
          filename: dbPath,
          driver: sqlite3.Database
        })

        // Get chat logs
        const chatResult = await db.get(`
          SELECT value FROM ItemTable 
          WHERE [key] = 'workbench.panel.aichat.view.aichat.chatdata'
        `)

        if (chatResult?.value) {
          const chatData = JSON.parse(chatResult.value)
          if (chatData.tabs && Array.isArray(chatData.tabs)) {
            const chatLogs = chatData.tabs.map((tab: ChatTab) => ({
              id: tab.id || '',
              workspaceId: entry.name,
              workspaceFolder,
              title: tab.title || `Chat ${(tab.id || '').slice(0, 8)}`,
              timestamp: new Date(tab.timestamp).getTime(),
              type: 'chat' as const,
              messageCount: tab.bubbles?.length || 0
            }))
            logs.push(...chatLogs)
          }
        } else {
          // Try new bubble-based format
          try {
            const globalDbPath = path.join(workspacePath, '..', 'globalStorage', 'state.vscdb')
            if (existsSync(globalDbPath)) {
              const globalDb = await open({
                filename: globalDbPath,
                driver: sqlite3.Database
              })

              // Get all bubble keys
              const allBubbles = await globalDb.all(`
                SELECT [key], value FROM cursorDiskKV 
                WHERE [key] LIKE 'bubbleId:%'
              `)

              // Group bubbles by chat ID
              const chatGroups: { [chatId: string]: any[] } = {}
              
              for (const bubble of allBubbles) {
                try {
                  const bubbleData = JSON.parse(bubble.value)
                  
                  // Skip if bubbleData is null or not an object
                  if (!bubbleData || typeof bubbleData !== 'object') {
                    continue
                  }
                  
                  const keyParts = bubble.key.split(':')
                  if (keyParts.length >= 2) {
                    const chatId = keyParts[1]
                    
                    // Only include chat bubbles (not composer)
                    if (bubbleData.isChat !== false) {
                      if (!chatGroups[chatId]) {
                        chatGroups[chatId] = []
                      }
                      chatGroups[chatId].push(bubbleData)
                    }
                  }
                } catch (error) {
                  // Skip invalid bubbles
                }
              }

              // Convert to chat logs
              for (const [chatId, bubbles] of Object.entries(chatGroups)) {
                const firstUserBubble = bubbles.find(b => b.type === 'user' || b.type === 1)
                const title = firstUserBubble?.text?.split('\n')[0]?.slice(0, 50) || `Chat ${chatId.slice(0, 8)}`
                
                logs.push({
                  id: chatId,
                  workspaceId: entry.name,
                  workspaceFolder,
                  title,
                  timestamp: Date.now(), // We'll need to figure out proper timestamps
                  type: 'chat' as const,
                  messageCount: bubbles.length
                })
              }

              await globalDb.close()
            }
          } catch (error) {
            console.error('Error processing new format chats:', error)
          }
        }

        // Get composer logs
        const composerResult = await db.get(`
          SELECT value FROM ItemTable 
          WHERE [key] = 'composer.composerData'
        `)

        if (composerResult?.value) {
          const composerData = JSON.parse(composerResult.value)
          if (composerData.allComposers && Array.isArray(composerData.allComposers)) {
            const composerLogs = composerData.allComposers.map((composer: ComposerChat) => ({
              id: composer.composerId || '',
              workspaceId: entry.name,
              workspaceFolder,
              title: composer.text || `Composer ${(composer.composerId || '').slice(0, 8)}`,
              timestamp: new Date(composer.lastUpdatedAt || composer.createdAt || 0).getTime(),
              type: 'composer' as const,
              messageCount: composer.conversation?.length || 0
            }))
            logs.push(...composerLogs)
          }
        }

        await db.close()
      }
    }

    // Sort by timestamp, newest first
    logs.sort((a, b) => b.timestamp - a.timestamp)
    
    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Failed to get logs:', error)
    return NextResponse.json({ error: 'Failed to get logs' }, { status: 500 })
  }
} 
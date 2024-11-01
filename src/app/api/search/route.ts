import { NextResponse } from "next/server"
import path from 'path'
import fs from 'fs/promises'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { existsSync } from 'fs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json([])
  }

  try {
    const workspacePath = process.env.WORKSPACE_PATH || ''
    const results = []
    
    const entries = await fs.readdir(workspacePath, { withFileTypes: true })
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dbPath = path.join(workspacePath, entry.name, 'state.vscdb')
        const workspaceJsonPath = path.join(workspacePath, entry.name, 'workspace.json')
        
        if (!existsSync(dbPath)) continue

        try {
          const db = await open({
            filename: dbPath,
            driver: sqlite3.Database
          })
          
          const result = await db.get(`
            SELECT value FROM ItemTable 
            WHERE [key] IN ('workbench.panel.aichat.view.aichat.chatdata')
          `)
          
          if (result?.value) {
            const chatData = JSON.parse(result.value)
            let workspaceFolder = ''
            
            try {
              const workspaceData = JSON.parse(await fs.readFile(workspaceJsonPath, 'utf-8'))
              workspaceFolder = workspaceData.folder || ''
            } catch {
              // Ignore workspace.json read errors
            }

            // Search through each chat tab
            for (const tab of chatData.tabs || []) {
              let hasMatch = false
              let matchingText = ''

              // Search through chat bubbles
              for (const bubble of tab.bubbles || []) {
                if (bubble.text?.toLowerCase().includes(query.toLowerCase())) {
                  hasMatch = true
                  // Get a snippet of the matching text
                  const index = bubble.text.toLowerCase().indexOf(query.toLowerCase())
                  const start = Math.max(0, index - 50)
                  const end = Math.min(bubble.text.length, index + query.length + 50)
                  matchingText = (start > 0 ? '...' : '') +
                    bubble.text.slice(start, end) +
                    (end < bubble.text.length ? '...' : '')
                  break
                }

                // Also search through selections
                if (!hasMatch && bubble.selections) {
                  for (const selection of bubble.selections) {
                    if (selection.text?.toLowerCase().includes(query.toLowerCase())) {
                      hasMatch = true
                      matchingText = `Selection: ${selection.text.slice(0, 100)}${selection.text.length > 100 ? '...' : ''}`
                      break
                    }
                  }
                }
              }

              if (hasMatch) {
                results.push({
                  workspaceId: entry.name,
                  workspaceFolder,
                  chatId: tab.tabId,
                  chatTitle: tab.chatTitle || `Chat ${tab.tabId?.substring(0, 8) || 'Untitled'}`,
                  timestamp: tab.lastSendTime || new Date().toISOString(),
                  matchingText
                })
              }
            }
          }
          
          await db.close()
        } catch (error) {
          console.error(`Error processing workspace ${entry.name}:`, error)
        }
      }
    }
    
    // Sort results by timestamp, newest first
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    return NextResponse.json(results)
  } catch (error) {
    console.error('Failed to search:', error)
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 })
  }
} 
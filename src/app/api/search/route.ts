import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { existsSync } from 'fs'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'all'

    if (!query) {
      return NextResponse.json({ error: 'No search query provided' }, { status: 400 })
    }

    // Get workspace path from cookies instead of environment variable
    const cookieStore = cookies()
    const rawWorkspacePath = cookieStore.get('workspacePath')?.value
    const workspacePath = rawWorkspacePath ? decodeURIComponent(rawWorkspacePath) : process.env.WORKSPACE_PATH || ''
    
    if (!workspacePath) {
      return NextResponse.json({ error: 'Workspace path not configured' }, { status: 400 })
    }

    const results = []
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
        } catch (error) {
          console.log(`No workspace.json found for ${entry.name}`)
        }

          const db = await open({
            filename: dbPath,
            driver: sqlite3.Database
          })

          // Search chat logs if type is 'all' or 'chat'
          if (type === 'all' || type === 'chat') {
            const chatResult = await db.get(`
              SELECT value FROM ItemTable 
              WHERE [key] = 'workbench.panel.aichat.view.aichat.chatdata'
            `)

            if (chatResult?.value) {
              const chatData = JSON.parse(chatResult.value)
            if (chatData.tabs && Array.isArray(chatData.tabs)) {
              for (const tab of chatData.tabs) {
                const title = tab.chatTitle?.split('\n')[0] || `Chat ${tab.tabId.slice(0, 8)}`
                const content = tab.bubbles?.map((bubble: any) => bubble.text).join(' ') || ''
                
                if (title.toLowerCase().includes(query.toLowerCase()) || 
                    content.toLowerCase().includes(query.toLowerCase())) {
                  
                  // Find matching snippets
                  const snippets = []
                  const words = query.toLowerCase().split(' ')
                  
                  for (const bubble of tab.bubbles || []) {
                    const text = bubble.text || ''
                    const lowerText = text.toLowerCase()
                    
                    for (const word of words) {
                      if (lowerText.includes(word)) {
                        const index = lowerText.indexOf(word)
                        const start = Math.max(0, index - 50)
                        const end = Math.min(text.length, index + word.length + 50)
                        const snippet = text.slice(start, end)
                        snippets.push(snippet)
                    break
                      }
                  }
                }

                  results.push({
                    id: tab.tabId,
                    workspaceId: entry.name,
                    workspaceFolder,
                    title,
                    type: 'chat',
                    timestamp: new Date(tab.lastSendTime || 0).toISOString(),
                    snippets: snippets.slice(0, 3) // Limit to 3 snippets
                  })
                }
                }
              }
            }
          }

          // Search composer logs if type is 'all' or 'composer'
          if (type === 'all' || type === 'composer') {
            const composerResult = await db.get(`
              SELECT value FROM ItemTable 
              WHERE [key] = 'composer.composerData'
            `)

            if (composerResult?.value) {
              const composerData = JSON.parse(composerResult.value)
            if (composerData.allComposers && Array.isArray(composerData.allComposers)) {
              for (const composer of composerData.allComposers) {
                const title = composer.text || 'Untitled'
                const content = composer.conversation?.map((msg: any) => msg.text).join(' ') || ''
                
                if (title.toLowerCase().includes(query.toLowerCase()) || 
                    content.toLowerCase().includes(query.toLowerCase())) {
                  
                  // Find matching snippets
                  const snippets = []
                  const words = query.toLowerCase().split(' ')
                  
                  for (const msg of composer.conversation || []) {
                    const text = msg.text || ''
                    const lowerText = text.toLowerCase()
                    
                    for (const word of words) {
                      if (lowerText.includes(word)) {
                        const index = lowerText.indexOf(word)
                        const start = Math.max(0, index - 50)
                        const end = Math.min(text.length, index + word.length + 50)
                        const snippet = text.slice(start, end)
                        snippets.push(snippet)
                      break
                    }
                  }
                }

                  results.push({
                    id: composer.composerId,
                    workspaceId: entry.name,
                    workspaceFolder,
                    title,
                    type: 'composer',
                    timestamp: new Date(composer.lastUpdatedAt || composer.createdAt || 0).toISOString(),
                    snippets: snippets.slice(0, 3) // Limit to 3 snippets
                  })
                }
              }
            }
          }
        }

        await db.close()
      }
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
} 
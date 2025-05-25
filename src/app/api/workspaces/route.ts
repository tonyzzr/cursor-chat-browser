import { NextResponse } from "next/server"
import path from 'path'
import fs from 'fs/promises'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { existsSync } from 'fs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    // TEMPORARY HARDCODE: Testing if path is the issue
    const workspacePath = '/Users/zhuoruizhang/Library/Application Support/Cursor/User/workspaceStorage'
    
    console.log('HARDCODED workspace path:', workspacePath)
    
    if (!workspacePath) {
      return NextResponse.json({ error: 'Workspace path not configured' }, { status: 400 })
    }
    
    const workspaces = []
    
    const entries = await fs.readdir(workspacePath, { withFileTypes: true })
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dbPath = path.join(workspacePath, entry.name, 'state.vscdb')
        const workspaceJsonPath = path.join(workspacePath, entry.name, 'workspace.json')
        
        // Skip if state.vscdb doesn't exist
        if (!existsSync(dbPath)) {
          console.log(`Skipping ${entry.name}: no state.vscdb found`)
          continue
        }
        
        try {
          const stats = await fs.stat(dbPath)
          const db = await open({
            filename: dbPath,
            driver: sqlite3.Database
          })
          
          const result = await db.get(`
            SELECT value FROM ItemTable 
            WHERE [key] IN ('workbench.panel.aichat.view.aichat.chatdata')
          `)
          
          // Parse the chat data and count tabs
          let chatCount = 0
          if (result?.value) {
            try {
              const chatData = JSON.parse(result.value)
              chatCount = chatData.tabs?.length || 0
            } catch (error) {
              console.error('Error parsing chat data:', error)
            }
          } else {
            // For new format, we can't easily count chats per workspace
            // since they're all stored in global storage
            // Set a placeholder count to indicate new format is being used
            chatCount = -1 // Special value to indicate new format
          }
          
          // Try to read workspace.json
          let folder = undefined
          try {
            const workspaceData = JSON.parse(await fs.readFile(workspaceJsonPath, 'utf-8'))
            folder = workspaceData.folder
          } catch (error) {
            console.log(`No workspace.json found for ${entry.name}`)
          }
          
          workspaces.push({
            id: entry.name,
            path: dbPath,
            folder: folder,
            lastModified: stats.mtime.toISOString(),
            chatCount: chatCount
          })
          
          await db.close()
        } catch (error) {
          console.error(`Error processing workspace ${entry.name}:`, error)
        }
      }
    }
    
    return NextResponse.json(workspaces)
  } catch (error) {
    console.error('Failed to get workspaces:', error)
    return NextResponse.json({ error: 'Failed to get workspaces' }, { status: 500 })
  }
} 
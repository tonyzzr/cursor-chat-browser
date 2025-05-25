import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { existsSync } from 'fs'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { ComposerChat, ComposerData } from '@/types/workspace'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    // TEMPORARY HARDCODE: Testing if path is the issue
    const workspacePath = '/Users/zhuoruizhang/Library/Application Support/Cursor/User/workspaceStorage'
    
    console.log('HARDCODED workspace path:', workspacePath)
    
    if (!workspacePath) {
      return NextResponse.json({ error: 'Workspace path not configured' }, { status: 400 })
    }
    
    const composers = []
    
    const entries = await fs.readdir(workspacePath, { withFileTypes: true })
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dbPath = path.join(workspacePath, entry.name, 'state.vscdb')
        const workspaceJsonPath = path.join(workspacePath, entry.name, 'workspace.json')
        
        if (!existsSync(dbPath)) continue

        // Get workspace folder info
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
        
        const result = await db.get(`
          SELECT value FROM ItemTable 
          WHERE [key] = 'composer.composerData'
        `)
        
        if (result?.value) {
          const composerData = JSON.parse(result.value) as ComposerData
          // Add workspace info to each composer and ensure conversation exists
          const composersWithWorkspace = composerData.allComposers.map(composer => ({
            ...composer,
            conversation: composer.conversation || [],  // Provide default empty array
            workspaceId: entry.name,
            workspaceFolder
          }))
          composers.push(...composersWithWorkspace)
        }
        
        await db.close()
      }
    }

    return NextResponse.json(composers.sort((a, b) => 
      new Date(b.lastUpdatedAt || b.createdAt).getTime() - 
      new Date(a.lastUpdatedAt || a.createdAt).getTime()
    ))
  } catch (error) {
    console.error('Failed to get composers:', error)
    return NextResponse.json({ error: 'Failed to get composers' }, { status: 500 })
  }
} 
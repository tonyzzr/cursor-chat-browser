import { NextResponse } from "next/server"
import path from 'path'
import fs from 'fs/promises'
import { existsSync } from 'fs'
import { expandTildePath } from '@/utils/path'

export async function POST(request: Request) {
  try {
    const { path: workspacePath } = await request.json()
    console.log('Original path:', workspacePath)
    
    const expandedPath = expandTildePath(workspacePath)
    console.log('Expanded path:', expandedPath)
    
    if (!existsSync(expandedPath)) {
      console.log('Path does not exist:', expandedPath)
      return NextResponse.json({ valid: false, error: 'Path does not exist' })
    }

    const entries = await fs.readdir(expandedPath, { withFileTypes: true })
    console.log('Found entries:', entries.map(e => e.name))
    
    const workspaceCount = entries.filter(entry => {
      if (!entry.isDirectory()) return false
      const dbPath = path.join(expandedPath, entry.name, 'state.vscdb')
      const exists = existsSync(dbPath)
      console.log('Checking workspace:', entry.name, 'DB exists:', exists)
      return exists
    }).length

    console.log('Workspace count:', workspaceCount)

    return NextResponse.json({
      valid: workspaceCount > 0,
      workspaceCount
    })
  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json({ 
      valid: false, 
      error: 'Failed to validate path' 
    }, { status: 500 })
  }
} 
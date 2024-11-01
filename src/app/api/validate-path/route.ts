import { NextResponse } from "next/server"
import path from 'path'
import fs from 'fs/promises'
import { existsSync } from 'fs'

export async function POST(request: Request) {
  try {
    const { path: workspacePath } = await request.json()
    
    if (!existsSync(workspacePath)) {
      return NextResponse.json({ valid: false, error: 'Path does not exist' })
    }

    const entries = await fs.readdir(workspacePath, { withFileTypes: true })
    const workspaceCount = entries.filter(entry => {
      if (!entry.isDirectory()) return false
      const dbPath = path.join(workspacePath, entry.name, 'state.vscdb')
      return existsSync(dbPath)
    }).length

    return NextResponse.json({
      valid: workspaceCount > 0,
      workspaceCount
    })
  } catch (error) {
    return NextResponse.json({ 
      valid: false, 
      error: 'Failed to validate path' 
    }, { status: 500 })
  }
} 
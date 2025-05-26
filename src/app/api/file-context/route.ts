import { NextResponse } from "next/server"
import path from 'path'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const since = searchParams.get('since') // ISO timestamp or bubble ID
    const format = searchParams.get('format') || 'json' // json or text
    const fileFilter = searchParams.get('file') // Filter by filename pattern
    const includeContent = searchParams.get('includeContent') !== 'false' // Default true
    const contextType = searchParams.get('type') // 'attached', 'git', 'viewed', 'all'
    
    const workspacePath = '/Users/zhuoruizhang/Library/Application Support/Cursor/User/workspaceStorage'
    const globalDbPath = path.join(workspacePath, '..', 'globalStorage', 'state.vscdb')
    
    console.log('File Context API: Opening database at:', globalDbPath)

    const db = await open({
      filename: globalDbPath,
      driver: sqlite3.Database
    })

    // Get recent bubbles that might contain file context
    let query = `
      SELECT rowid, [key], value FROM cursorDiskKV 
      WHERE [key] LIKE 'bubbleId:%'
      ORDER BY rowid DESC
      LIMIT ?
    `
    const params = [Math.min(limit * 50, 2000)] // Get many bubbles to find file context

    const recentBubbles = await db.all(query, params)

    // Extract file context from bubbles
    const fileContexts: any[] = []
    
    for (const bubble of recentBubbles) {
      try {
        const parsed = JSON.parse(bubble.value)
        const keyParts = bubble.key.split(':')
        const chatId = keyParts[1]
        const bubbleId = keyParts[2]
        
        // Process attached code chunks
        if (parsed.attachedCodeChunks && parsed.attachedCodeChunks.length > 0 && 
            (!contextType || contextType === 'attached' || contextType === 'all')) {
          for (let i = 0; i < parsed.attachedCodeChunks.length; i++) {
            const chunk = parsed.attachedCodeChunks[i]
            
            const context = {
              id: `${bubbleId}-attached-${i}`,
              bubbleId,
              chatId,
              rowId: bubble.rowid,
              timestamp: new Date().toISOString(),
              type: 'attached',
              filename: chunk.filename || chunk.path || 'unknown',
              content: includeContent ? (chunk.content || chunk.text || '') : null,
              metadata: {
                startLine: chunk.startLine || null,
                endLine: chunk.endLine || null,
                lineCount: chunk.content ? chunk.content.split('\n').length : 0,
                characterCount: chunk.content ? chunk.content.length : 0,
                language: chunk.language || null,
                isComplete: chunk.isComplete !== false
              },
              context: {
                messageType: parsed.type === 1 ? 'user' : parsed.type === 2 ? 'assistant' : 'unknown',
                isAgentic: parsed.isAgentic || false
              }
            }
            
            // Apply file filter if specified
            if (!fileFilter || context.filename.toLowerCase().includes(fileFilter.toLowerCase())) {
              fileContexts.push(context)
            }
          }
        }

        // Process git diffs
        if (parsed.gitDiffs && parsed.gitDiffs.length > 0 && 
            (!contextType || contextType === 'git' || contextType === 'all')) {
          for (let i = 0; i < parsed.gitDiffs.length; i++) {
            const diff = parsed.gitDiffs[i]
            
            const context = {
              id: `${bubbleId}-git-${i}`,
              bubbleId,
              chatId,
              rowId: bubble.rowid,
              timestamp: new Date().toISOString(),
              type: 'git',
              filename: diff.filename || diff.path || 'unknown',
              content: includeContent ? (diff.diff || diff.content || '') : null,
              metadata: {
                changeType: diff.type || 'modified',
                additions: diff.additions || null,
                deletions: diff.deletions || null,
                isBinary: diff.isBinary || false,
                isNew: diff.isNew || false,
                isDeleted: diff.isDeleted || false
              },
              context: {
                messageType: parsed.type === 1 ? 'user' : parsed.type === 2 ? 'assistant' : 'unknown',
                isAgentic: parsed.isAgentic || false
              }
            }
            
            // Apply file filter if specified
            if (!fileFilter || context.filename.toLowerCase().includes(fileFilter.toLowerCase())) {
              fileContexts.push(context)
            }
          }
        }

        // Process recently viewed files
        if (parsed.recentlyViewedFiles && parsed.recentlyViewedFiles.length > 0 && 
            (!contextType || contextType === 'viewed' || contextType === 'all')) {
          for (let i = 0; i < parsed.recentlyViewedFiles.length; i++) {
            const file = parsed.recentlyViewedFiles[i]
            const filename = typeof file === 'string' ? file : (file.filename || file.path || 'unknown')
            
            const context = {
              id: `${bubbleId}-viewed-${i}`,
              bubbleId,
              chatId,
              rowId: bubble.rowid,
              timestamp: new Date().toISOString(),
              type: 'viewed',
              filename: filename,
              content: null, // Recently viewed files don't include content
              metadata: {
                lastViewed: typeof file === 'object' ? file.lastViewed : null,
                viewCount: typeof file === 'object' ? file.viewCount : null
              },
              context: {
                messageType: parsed.type === 1 ? 'user' : parsed.type === 2 ? 'assistant' : 'unknown',
                isAgentic: parsed.isAgentic || false
              }
            }
            
            // Apply file filter if specified
            if (!fileFilter || context.filename.toLowerCase().includes(fileFilter.toLowerCase())) {
              fileContexts.push(context)
            }
          }
        }

        // Process context pieces
        if (parsed.contextPieces && parsed.contextPieces.length > 0 && 
            (!contextType || contextType === 'context' || contextType === 'all')) {
          for (let i = 0; i < parsed.contextPieces.length; i++) {
            const piece = parsed.contextPieces[i]
            
            const context = {
              id: `${bubbleId}-context-${i}`,
              bubbleId,
              chatId,
              rowId: bubble.rowid,
              timestamp: new Date().toISOString(),
              type: 'context',
              filename: piece.filename || piece.path || null,
              content: includeContent ? (piece.content || piece.text || '') : null,
              metadata: {
                pieceType: piece.type || 'unknown',
                relevance: piece.relevance || null,
                source: piece.source || null
              },
              context: {
                messageType: parsed.type === 1 ? 'user' : parsed.type === 2 ? 'assistant' : 'unknown',
                isAgentic: parsed.isAgentic || false
              }
            }
            
            // Apply file filter if specified
            if (!fileFilter || !context.filename || context.filename.toLowerCase().includes(fileFilter.toLowerCase())) {
              fileContexts.push(context)
            }
          }
        }
      } catch (e) {
        // Skip invalid bubbles
      }
    }

    // Sort by rowId (chronological order)
    fileContexts.sort((a, b) => a.rowId - b.rowId)

    // Apply limit
    const limitedContexts = fileContexts.slice(-limit)

    // Filter by 'since' parameter if provided
    let filteredContexts = limitedContexts
    if (since) {
      if (since.includes('T')) {
        // ISO timestamp
        const sinceDate = new Date(since)
        filteredContexts = limitedContexts.filter(ctx => new Date(ctx.timestamp) > sinceDate)
      } else {
        // Bubble ID
        const sinceIndex = limitedContexts.findIndex(ctx => ctx.bubbleId === since)
        if (sinceIndex >= 0) {
          filteredContexts = limitedContexts.slice(sinceIndex + 1)
        }
      }
    }

    await db.close()

    // Generate summary statistics
    const typeStats = new Map<string, number>()
    const fileStats = new Map<string, number>()
    const extensionStats = new Map<string, number>()
    
    for (const context of filteredContexts) {
      // Type stats
      typeStats.set(context.type, (typeStats.get(context.type) || 0) + 1)
      
      // File stats
      if (context.filename) {
        fileStats.set(context.filename, (fileStats.get(context.filename) || 0) + 1)
        
        // Extension stats
        const ext = path.extname(context.filename).toLowerCase()
        if (ext) {
          extensionStats.set(ext, (extensionStats.get(ext) || 0) + 1)
        }
      }
    }

    const response = {
      fileContexts: filteredContexts,
      metadata: {
        totalContexts: filteredContexts.length,
        totalBubbles: recentBubbles.length,
        typeStats: Object.fromEntries(typeStats),
        topFiles: Object.fromEntries(Array.from(fileStats.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10)),
        extensionStats: Object.fromEntries(extensionStats),
        lastBubbleId: filteredContexts.length > 0 ? filteredContexts[filteredContexts.length - 1].bubbleId : null,
        timestamp: new Date().toISOString(),
        globalDbPath,
        fileFilter,
        contextType,
        includeContent
      }
    }

    // Return different formats based on request
    if (format === 'text') {
      const textOutput = filteredContexts.map(ctx => {
        let output = `📁 FILE CONTEXT: ${ctx.type.toUpperCase()}`
        if (ctx.filename) output += ` - ${ctx.filename}`
        output += `\n📅 Time: ${ctx.timestamp}`
        output += `\n👤 Source: ${ctx.context.messageType}`
        
        if (ctx.type === 'attached') {
          output += `\n📊 Lines: ${ctx.metadata.lineCount}, Characters: ${ctx.metadata.characterCount}`
          if (ctx.metadata.startLine) output += `\n📍 Range: ${ctx.metadata.startLine}-${ctx.metadata.endLine}`
        } else if (ctx.type === 'git') {
          output += `\n🔄 Change: ${ctx.metadata.changeType}`
          if (ctx.metadata.additions) output += `\n➕ Additions: ${ctx.metadata.additions}`
          if (ctx.metadata.deletions) output += `\n➖ Deletions: ${ctx.metadata.deletions}`
        } else if (ctx.type === 'viewed') {
          if (ctx.metadata.viewCount) output += `\n👁️  Views: ${ctx.metadata.viewCount}`
        }
        
        if (includeContent && ctx.content) {
          output += `\n${'─'.repeat(60)}\n${ctx.content.substring(0, 500)}${ctx.content.length > 500 ? '...' : ''}\n${'─'.repeat(60)}`
        }
        
        return output
      }).join('\n\n' + '='.repeat(80) + '\n\n')
      
      return new Response(textOutput, {
        headers: { 'Content-Type': 'text/plain' }
      })
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('File Context API error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      fileContexts: [],
      metadata: {}
    }, { status: 500 })
  }
} 
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
    const language = searchParams.get('language') // Filter by programming language
    const includeContent = searchParams.get('includeContent') !== 'false' // Default true
    
    const workspacePath = '/Users/zhuoruizhang/Library/Application Support/Cursor/User/workspaceStorage'
    const globalDbPath = path.join(workspacePath, '..', 'globalStorage', 'state.vscdb')
    
    console.log('Code Blocks API: Opening database at:', globalDbPath)

    const db = await open({
      filename: globalDbPath,
      driver: sqlite3.Database
    })

    // Get recent bubbles that might contain code blocks
    let query = `
      SELECT rowid, [key], value FROM cursorDiskKV 
      WHERE [key] LIKE 'bubbleId:%'
      ORDER BY rowid DESC
      LIMIT ?
    `
    const params = [Math.min(limit * 50, 2000)] // Get many bubbles to find code blocks

    const recentBubbles = await db.all(query, params)

    // Extract code blocks from bubbles
    const codeBlocks: any[] = []
    
    for (const bubble of recentBubbles) {
      try {
        const parsed = JSON.parse(bubble.value)
        const keyParts = bubble.key.split(':')
        const chatId = keyParts[1]
        const bubbleId = keyParts[2]
        
        if (parsed.codeBlocks && parsed.codeBlocks.length > 0) {
          for (let i = 0; i < parsed.codeBlocks.length; i++) {
            const codeBlock = parsed.codeBlocks[i]
            
            const block = {
              id: `${bubbleId}-${i}`,
              bubbleId,
              chatId,
              rowId: bubble.rowid,
              timestamp: new Date().toISOString(),
              language: codeBlock.language || 'text',
              filename: codeBlock.filename || codeBlock.path || null,
              content: includeContent ? (codeBlock.code || codeBlock.text || '') : null,
              metadata: {
                lineCount: codeBlock.code ? codeBlock.code.split('\n').length : 0,
                characterCount: codeBlock.code ? codeBlock.code.length : 0,
                startLine: codeBlock.startLine || null,
                endLine: codeBlock.endLine || null,
                isComplete: codeBlock.isComplete !== false,
                hasChanges: !!(codeBlock.changes || codeBlock.diff),
                isGenerated: codeBlock.isGenerated || false
              },
              context: {
                messageType: parsed.type === 1 ? 'user' : parsed.type === 2 ? 'assistant' : 'unknown',
                isAgentic: parsed.isAgentic || false,
                hasToolResults: !!(parsed.toolResults && parsed.toolResults.length > 0),
                hasAttachedFiles: !!(parsed.attachedCodeChunks && parsed.attachedCodeChunks.length > 0)
              }
            }
            
            // Apply language filter if specified
            if (!language || block.language.toLowerCase().includes(language.toLowerCase())) {
              codeBlocks.push(block)
            }
          }
        }
      } catch (e) {
        // Skip invalid bubbles
      }
    }

    // Sort by rowId (chronological order)
    codeBlocks.sort((a, b) => a.rowId - b.rowId)

    // Apply limit
    const limitedBlocks = codeBlocks.slice(-limit)

    // Filter by 'since' parameter if provided
    let filteredBlocks = limitedBlocks
    if (since) {
      if (since.includes('T')) {
        // ISO timestamp
        const sinceDate = new Date(since)
        filteredBlocks = limitedBlocks.filter(block => new Date(block.timestamp) > sinceDate)
      } else {
        // Bubble ID
        const sinceIndex = limitedBlocks.findIndex(block => block.bubbleId === since)
        if (sinceIndex >= 0) {
          filteredBlocks = limitedBlocks.slice(sinceIndex + 1)
        }
      }
    }

    await db.close()

    // Generate summary statistics
    const languageStats = new Map<string, number>()
    const totalLines = filteredBlocks.reduce((sum, block) => sum + block.metadata.lineCount, 0)
    const totalCharacters = filteredBlocks.reduce((sum, block) => sum + block.metadata.characterCount, 0)
    const generatedCount = filteredBlocks.filter(block => block.metadata.isGenerated).length
    const userBlocks = filteredBlocks.filter(block => block.context.messageType === 'user').length
    const assistantBlocks = filteredBlocks.filter(block => block.context.messageType === 'assistant').length
    
    for (const block of filteredBlocks) {
      const lang = block.language
      languageStats.set(lang, (languageStats.get(lang) || 0) + 1)
    }

    const response = {
      codeBlocks: filteredBlocks,
      metadata: {
        totalBlocks: filteredBlocks.length,
        totalBubbles: recentBubbles.length,
        totalLines,
        totalCharacters,
        averageLinesPerBlock: filteredBlocks.length > 0 ? Math.round(totalLines / filteredBlocks.length) : 0,
        languageStats: Object.fromEntries(languageStats),
        generatedCount,
        userBlocks,
        assistantBlocks,
        lastBubbleId: filteredBlocks.length > 0 ? filteredBlocks[filteredBlocks.length - 1].bubbleId : null,
        timestamp: new Date().toISOString(),
        globalDbPath,
        languageFilter: language,
        includeContent
      }
    }

    // Return different formats based on request
    if (format === 'text') {
      const textOutput = filteredBlocks.map(block => {
        let output = `💻 CODE BLOCK: ${block.language.toUpperCase()}`
        if (block.filename) output += ` (${block.filename})`
        output += `\n📅 Time: ${block.timestamp}`
        output += `\n👤 Source: ${block.context.messageType}`
        output += `\n📊 Lines: ${block.metadata.lineCount}, Characters: ${block.metadata.characterCount}`
        if (block.metadata.isGenerated) output += `\n🤖 Generated by AI`
        if (block.metadata.hasChanges) output += `\n📝 Has changes/diff`
        
        if (includeContent && block.content) {
          output += `\n${'─'.repeat(60)}\n${block.content}\n${'─'.repeat(60)}`
        }
        
        return output
      }).join('\n\n' + '='.repeat(80) + '\n\n')
      
      return new Response(textOutput, {
        headers: { 'Content-Type': 'text/plain' }
      })
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Code Blocks API error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      codeBlocks: [],
      metadata: {}
    }, { status: 500 })
  }
} 
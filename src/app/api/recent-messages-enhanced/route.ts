import { NextResponse } from "next/server"
import path from 'path'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const since = searchParams.get('since') // ISO timestamp or bubble ID
    const format = searchParams.get('format') || 'json' // json or text
    const includeEmpty = searchParams.get('includeEmpty') === 'true'
    const includeMetadata = searchParams.get('includeMetadata') !== 'false' // Default true
    const metadataLevel = searchParams.get('metadataLevel') || 'full' // basic, full, raw
    
    // TEMPORARY HARDCODE: Testing if path is the issue
    const workspacePath = '/Users/zhuoruizhang/Library/Application Support/Cursor/User/workspaceStorage'
    const globalDbPath = path.join(workspacePath, '..', 'globalStorage', 'state.vscdb')
    
    console.log('Enhanced Recent Messages API: Opening database at:', globalDbPath)

    const db = await open({
      filename: globalDbPath,
      driver: sqlite3.Database
    })

    // Get recent bubbles with rowid for proper sequencing
    let query = `
      SELECT rowid, [key], value FROM cursorDiskKV 
      WHERE [key] LIKE 'bubbleId:%'
      ORDER BY rowid DESC
      LIMIT ?
    `
    const params = [Math.min(limit * 20, 1000)] // Get many more bubbles to find ones with content

    const recentBubbles = await db.all(query, params)

    // Group by chat ID and find the most active conversation
    const conversationGroups = new Map<string, any[]>()
    
    for (const bubble of recentBubbles) {
      try {
        const parsed = JSON.parse(bubble.value)
        const keyParts = bubble.key.split(':')
        const chatId = keyParts[1]
        
        if (!conversationGroups.has(chatId)) {
          conversationGroups.set(chatId, [])
        }
        
        conversationGroups.get(chatId)?.push({
          ...parsed,
          bubbleKey: bubble.key,
          bubbleId: keyParts[2],
          rowId: bubble.rowid
        })
      } catch (e) {
        // Skip invalid bubbles
      }
    }

    // Find the conversation with the most content (text + metadata)
    let activeConversation = null
    let maxContentScore = 0
    
    for (const [chatId, bubbles] of Array.from(conversationGroups.entries())) {
      // Sort bubbles by rowId (chronological order) - higher rowId = more recent
      bubbles.sort((a, b) => a.rowId - b.rowId)
      
      // Score based on text content + rich metadata
      const contentScore = bubbles.reduce((score, b) => {
        let bubbleScore = 0
        if (b.text && b.text.length > 0) bubbleScore += 10
        if (b.toolResults && b.toolResults.length > 0) bubbleScore += 5
        if (b.codeBlocks && b.codeBlocks.length > 0) bubbleScore += 5
        if (b.attachedCodeChunks && b.attachedCodeChunks.length > 0) bubbleScore += 3
        if (b.gitDiffs && b.gitDiffs.length > 0) bubbleScore += 3
        if (b.lints && b.lints.length > 0) bubbleScore += 2
        if (b.capabilities && b.capabilities.length > 0) bubbleScore += 1
        return score + bubbleScore
      }, 0)
      
      if (contentScore > maxContentScore) {
        maxContentScore = contentScore
        activeConversation = { chatId, bubbles }
      }
    }

    if (!activeConversation) {
      await db.close()
      return NextResponse.json({ 
        error: 'No active conversation found',
        messages: [],
        metadata: { totalBubbles: 0, conversationCount: 0 }
      })
    }

    // Convert bubbles to enhanced messages with rich metadata
    let messages = activeConversation.bubbles.map((bubble: any, index: number) => {
      const isUser = bubble.type === 1 || bubble.type === 'user'
      const isAssistant = bubble.type === 2 || bubble.type === 'assistant'
      
      let text = bubble.text || bubble.richText || ''
      
      // Extract from code blocks if no direct text
      if (!text && bubble.codeBlocks && bubble.codeBlocks.length > 0) {
        text = bubble.codeBlocks.map((block: any) => block.code || block.text || '').join('\n\n')
      }
      
      // Extract from tool results if still no text
      if (!text && bubble.toolResults && bubble.toolResults.length > 0) {
        text = bubble.toolResults.map((result: any) => result.output || result.text || '').join('\n\n')
      }

      // Basic message structure
      const message: any = {
        id: bubble.bubbleId,
        bubbleKey: bubble.bubbleKey,
        rowId: bubble.rowId,
        type: isUser ? 'user' : isAssistant ? 'assistant' : 'unknown',
        text: text,
        timestamp: new Date().toISOString(),
      }

      // Add metadata based on level requested
      if (includeMetadata && metadataLevel !== 'none') {
        // Basic metadata (always included)
        message.metadata = {
          hasContent: {
            text: !!(bubble.text && bubble.text.length > 0),
            codeBlocks: !!(bubble.codeBlocks && bubble.codeBlocks.length > 0),
            toolResults: !!(bubble.toolResults && bubble.toolResults.length > 0),
            attachedFiles: !!(bubble.attachedCodeChunks && bubble.attachedCodeChunks.length > 0),
            gitDiffs: !!(bubble.gitDiffs && bubble.gitDiffs.length > 0),
            lints: !!(bubble.lints && bubble.lints.length > 0)
          },
          isAgentic: bubble.isAgentic || false,
          tokenCount: bubble.tokenCount || 0,
          capabilities: bubble.capabilities || []
        }

        // Full metadata (includes actual content)
        if (metadataLevel === 'full') {
          if (bubble.codeBlocks && bubble.codeBlocks.length > 0) {
            message.metadata.codeBlocks = bubble.codeBlocks.map((block: any) => ({
              language: block.language || 'text',
              code: block.code || block.text || '',
              filename: block.filename || null
            }))
          }

          if (bubble.toolResults && bubble.toolResults.length > 0) {
            message.metadata.toolResults = bubble.toolResults.map((result: any) => ({
              tool: result.tool || result.name || 'unknown',
              output: result.output || result.text || '',
              success: result.success !== false,
              duration: result.duration || null
            }))
          }

          if (bubble.attachedCodeChunks && bubble.attachedCodeChunks.length > 0) {
            message.metadata.attachedFiles = bubble.attachedCodeChunks.map((chunk: any) => ({
              filename: chunk.filename || chunk.path || 'unknown',
              content: chunk.content || chunk.text || '',
              startLine: chunk.startLine || null,
              endLine: chunk.endLine || null
            }))
          }

          if (bubble.gitDiffs && bubble.gitDiffs.length > 0) {
            message.metadata.gitDiffs = bubble.gitDiffs.map((diff: any) => ({
              filename: diff.filename || diff.path || 'unknown',
              diff: diff.diff || diff.content || '',
              type: diff.type || 'modified'
            }))
          }

          if (bubble.lints && bubble.lints.length > 0) {
            message.metadata.lints = bubble.lints.map((lint: any) => ({
              filename: lint.filename || lint.path || 'unknown',
              message: lint.message || lint.text || '',
              severity: lint.severity || 'info',
              line: lint.line || null
            }))
          }

          if (bubble.recentlyViewedFiles && bubble.recentlyViewedFiles.length > 0) {
            message.metadata.recentlyViewedFiles = bubble.recentlyViewedFiles
          }

          if (bubble.contextPieces && bubble.contextPieces.length > 0) {
            message.metadata.contextPieces = bubble.contextPieces.map((piece: any) => ({
              type: piece.type || 'unknown',
              content: piece.content || piece.text || '',
              filename: piece.filename || piece.path || null
            }))
          }
        }

        // Raw metadata (includes everything)
        if (metadataLevel === 'raw') {
          message.rawBubble = bubble
        }
      }

      return message
    })

    // Deduplicate messages with identical text content (keep the one with highest rowId)
    const deduplicatedMessages = new Map<string, any>()
    for (const message of messages) {
      if (message.text && message.text.length > 0) {
        const key = `${message.type}:${message.text.trim()}`
        const existing = deduplicatedMessages.get(key)
        if (!existing || message.rowId > existing.rowId) {
          deduplicatedMessages.set(key, message)
        }
      } else if (includeEmpty) {
        // Keep empty messages as-is (they're usually unique)
        deduplicatedMessages.set(`empty:${message.rowId}`, message)
      }
    }
    
    messages = Array.from(deduplicatedMessages.values()).sort((a, b) => a.rowId - b.rowId)

    // Apply limit AFTER filtering
    messages = messages.slice(-limit)

    // Filter by 'since' parameter if provided
    if (since) {
      if (since.includes('T')) {
        // ISO timestamp
        const sinceDate = new Date(since)
        messages = messages.filter(msg => new Date(msg.timestamp) > sinceDate)
      } else {
        // Bubble ID
        const sinceIndex = messages.findIndex(msg => msg.id === since)
        if (sinceIndex >= 0) {
          messages = messages.slice(sinceIndex + 1)
        }
      }
    }

    await db.close()

    const response = {
      chatId: activeConversation.chatId,
      messages,
      metadata: {
        totalMessages: messages.length,
        totalBubbles: activeConversation.bubbles.length,
        conversationCount: conversationGroups.size,
        lastBubbleId: messages.length > 0 ? messages[messages.length - 1].id : null,
        timestamp: new Date().toISOString(),
        globalDbPath,
        contentScore: maxContentScore,
        metadataLevel,
        includeEmpty
      }
    }

    // Return different formats based on request
    if (format === 'text') {
      const textOutput = messages.map(msg => {
        let output = `[${msg.type.toUpperCase()}] ${msg.text}`
        
        if (msg.metadata && metadataLevel === 'full') {
          const meta = msg.metadata
          if (meta.hasContent.codeBlocks) output += `\n  📝 Code blocks: ${meta.codeBlocks?.length || 0}`
          if (meta.hasContent.toolResults) output += `\n  🔧 Tool results: ${meta.toolResults?.length || 0}`
          if (meta.hasContent.attachedFiles) output += `\n  📎 Attached files: ${meta.attachedFiles?.length || 0}`
          if (meta.hasContent.gitDiffs) output += `\n  📊 Git diffs: ${meta.gitDiffs?.length || 0}`
          if (meta.hasContent.lints) output += `\n  ⚠️  Lint issues: ${meta.lints?.length || 0}`
          if (meta.isAgentic) output += `\n  🤖 Agentic: true`
          if (meta.tokenCount > 0) output += `\n  📊 Tokens: ${meta.tokenCount}`
        }
        
        return output
      }).join('\n\n---\n\n')
      
      return new Response(textOutput, {
        headers: { 'Content-Type': 'text/plain' }
      })
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Enhanced recent messages API error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      messages: [],
      metadata: {}
    }, { status: 500 })
  }
} 
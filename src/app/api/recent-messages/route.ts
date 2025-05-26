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
    
    // TEMPORARY HARDCODE: Testing if path is the issue
    const workspacePath = '/Users/zhuoruizhang/Library/Application Support/Cursor/User/workspaceStorage'
    const globalDbPath = path.join(workspacePath, '..', 'globalStorage', 'state.vscdb')
    
    console.log('Recent Messages API: Opening database at:', globalDbPath)

    const db = await open({
      filename: globalDbPath,
      driver: sqlite3.Database
    })

    // Get recent bubbles
    let query = `
      SELECT [key], value FROM cursorDiskKV 
      WHERE [key] LIKE 'bubbleId:%'
      ORDER BY rowid DESC
      LIMIT ?
    `
    const params = [Math.min(limit * 5, 500)] // Get more bubbles to filter from

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

    // Find the conversation with the most text content
    let activeConversation = null
    let maxTextBubbles = 0
    
    for (const [chatId, bubbles] of Array.from(conversationGroups.entries())) {
      const textBubbleCount = bubbles.filter(b => b.text && b.text.length > 0).length
      if (textBubbleCount > maxTextBubbles) {
        maxTextBubbles = textBubbleCount
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

    // Convert bubbles to messages
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
      
      return {
        id: bubble.bubbleId,
        bubbleKey: bubble.bubbleKey,
        type: isUser ? 'user' : isAssistant ? 'assistant' : 'unknown',
        text: text,
        timestamp: new Date().toISOString(), // Use current time since bubble timestamps aren't reliable
        hasCodeBlocks: bubble.codeBlocks && bubble.codeBlocks.length > 0,
        hasToolResults: bubble.toolResults && bubble.toolResults.length > 0,
        hasAttachedFiles: bubble.attachedCodeChunks && bubble.attachedCodeChunks.length > 0,
        isAgentic: bubble.isAgentic || false,
        capabilities: bubble.capabilities || []
      }
    })

    // Filter out empty messages unless requested
    if (!includeEmpty) {
      messages = messages.filter(msg => msg.text && msg.text.length > 0)
    }

    // Apply limit
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
        globalDbPath
      }
    }

    // Return different formats based on request
    if (format === 'text') {
      const textOutput = messages.map(msg => 
        `[${msg.type.toUpperCase()}] ${msg.text}`
      ).join('\n\n---\n\n')
      
      return new Response(textOutput, {
        headers: { 'Content-Type': 'text/plain' }
      })
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Recent messages API error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      messages: [],
      metadata: {}
    }, { status: 500 })
  }
} 
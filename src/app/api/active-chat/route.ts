import { NextResponse } from "next/server"
import path from 'path'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

export async function GET() {
  try {
    // TEMPORARY HARDCODE: Testing if path is the issue
    const workspacePath = '/Users/zhuoruizhang/Library/Application Support/Cursor/User/workspaceStorage'
    const globalDbPath = path.join(workspacePath, '..', 'globalStorage', 'state.vscdb')
    
    console.log('Active Chat: Opening database at:', globalDbPath)

    const db = await open({
      filename: globalDbPath,
      driver: sqlite3.Database
    })

    // Get the most recent bubbles to find the active conversation
    // Let's get more bubbles to ensure we find ones with text
    const recentBubbles = await db.all(`
      SELECT rowid, [key], value FROM cursorDiskKV 
      WHERE [key] LIKE 'bubbleId:%'
      ORDER BY rowid DESC
      LIMIT 200
    `)

    // Group by chat ID and find the most recent active conversation
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

    // Find the conversation with the most recent activity and text content
    let activeConversation = null
    
    if (conversationGroups.size > 0) {
      // Look for a conversation that has bubbles with text content
      let bestConversation = null
      let maxTextBubbles = 0
      
      for (const [chatId, bubbles] of Array.from(conversationGroups.entries())) {
        // Sort bubbles by rowId (chronological order) - higher rowId = more recent
        bubbles.sort((a, b) => a.rowId - b.rowId)
        
        const textBubbleCount = bubbles.filter(b => b.text && b.text.length > 0).length
        console.log(`Chat ${chatId}: ${bubbles.length} bubbles, ${textBubbleCount} with text`)
        
        if (textBubbleCount > maxTextBubbles) {
          maxTextBubbles = textBubbleCount
          bestConversation = { chatId, bubbles }
        }
      }
      
      // If no conversation has text, fall back to the first one
      if (!bestConversation && conversationGroups.size > 0) {
        const [firstChatId, firstBubbles] = Array.from(conversationGroups.entries())[0]
        bestConversation = { chatId: firstChatId, bubbles: firstBubbles }
      }
      
      activeConversation = bestConversation
      
      if (activeConversation) {
        console.log(`Active Chat: Selected conversation ${activeConversation.chatId} with ${activeConversation.bubbles.length} bubbles`)
        
        // Debug: log first few bubbles
        activeConversation.bubbles.slice(0, 3).forEach((bubble, i) => {
          console.log(`Bubble ${i}: key=${bubble.bubbleKey}, type=${bubble.type}, hasText=${!!bubble.text}, text="${bubble.text?.substring(0, 50)}..."`)
        })
      }
    }

    if (!activeConversation) {
      await db.close()
      return NextResponse.json({ error: 'No active conversation found' }, { status: 404 })
    }

    // Convert bubbles to a readable format
    const messages = activeConversation.bubbles.map((bubble: any, index: number) => {
      const isUser = bubble.type === 1 || bubble.type === 'user'
      const isAssistant = bubble.type === 2 || bubble.type === 'assistant'
      
      // Try to extract text from various possible fields
      let text = bubble.text || bubble.richText || ''
      
      // Debug logging
      if (index < 3) {
        console.log(`Message ${index}: bubble.text="${bubble.text}", bubble.richText="${bubble.richText}", extracted text="${text}"`)
      }
      
      // If no direct text, try to extract from code blocks or other content
      if (!text && bubble.codeBlocks && bubble.codeBlocks.length > 0) {
        text = bubble.codeBlocks.map((block: any) => block.code || block.text || '').join('\n\n')
      }
      
      // If still no text, try tool results
      if (!text && bubble.toolResults && bubble.toolResults.length > 0) {
        text = bubble.toolResults.map((result: any) => result.output || result.text || '').join('\n\n')
      }
      
      return {
        id: bubble.bubbleId || index,
        type: isUser ? 'user' : isAssistant ? 'assistant' : 'unknown',
        text: text,
        timestamp: bubble.timestamp || bubble.createdAt,
        hasCodeBlocks: bubble.codeBlocks && bubble.codeBlocks.length > 0,
        hasToolResults: bubble.toolResults && bubble.toolResults.length > 0,
        hasAttachedFiles: bubble.attachedCodeChunks && bubble.attachedCodeChunks.length > 0,
        isAgentic: bubble.isAgentic || false,
        capabilities: bubble.capabilities || [],
        // Include raw data for debugging
        rawKeys: Object.keys(bubble),
        // Include some raw content for debugging
        rawContent: {
          hasText: !!bubble.text,
          hasRichText: !!bubble.richText,
          codeBlockCount: bubble.codeBlocks?.length || 0,
          toolResultCount: bubble.toolResults?.length || 0
        }
      }
    }) // Don't filter out empty messages for now, so we can see the structure

    // Try to extract a conversation title from the first user message
    const firstUserMessage = messages.find((msg: any) => msg.type === 'user')
    const title = firstUserMessage?.text?.split('\n')[0]?.slice(0, 100) || 
                 `Active Chat ${activeConversation.chatId.slice(0, 8)}`

    await db.close()

    return NextResponse.json({
      chatId: activeConversation.chatId,
      title,
      messageCount: messages.length,
      totalBubbles: activeConversation.bubbles.length,
      lastActivity: new Date().toISOString(),
      messages,
      // Include some metadata for debugging
      metadata: {
        globalDbPath,
        totalConversations: conversationGroups.size,
        recentBubblesChecked: recentBubbles.length
      }
    })
  } catch (error) {
    console.error('Active chat endpoint error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 
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
    const toolFilter = searchParams.get('tool') // Filter by specific tool name
    
    const workspacePath = '/Users/zhuoruizhang/Library/Application Support/Cursor/User/workspaceStorage'
    const globalDbPath = path.join(workspacePath, '..', 'globalStorage', 'state.vscdb')
    
    console.log('Tool Results API: Opening database at:', globalDbPath)

    const db = await open({
      filename: globalDbPath,
      driver: sqlite3.Database
    })

    // Get recent bubbles that might contain tool results
    let query = `
      SELECT rowid, [key], value FROM cursorDiskKV 
      WHERE [key] LIKE 'bubbleId:%'
      ORDER BY rowid DESC
      LIMIT ?
    `
    const params = [Math.min(limit * 50, 2000)] // Get many bubbles to find tool results

    const recentBubbles = await db.all(query, params)

    // Extract tool results from bubbles
    const toolResults: any[] = []
    
    for (const bubble of recentBubbles) {
      try {
        const parsed = JSON.parse(bubble.value)
        const keyParts = bubble.key.split(':')
        const chatId = keyParts[1]
        const bubbleId = keyParts[2]
        
        if (parsed.toolResults && parsed.toolResults.length > 0) {
          for (const toolResult of parsed.toolResults) {
            const result = {
              id: `${bubbleId}-${toolResults.length}`,
              bubbleId,
              chatId,
              rowId: bubble.rowid,
              timestamp: new Date().toISOString(),
              tool: {
                name: toolResult.tool || toolResult.name || 'unknown',
                type: toolResult.type || 'unknown',
                version: toolResult.version || null
              },
              execution: {
                success: toolResult.success !== false,
                duration: toolResult.duration || null,
                startTime: toolResult.startTime || null,
                endTime: toolResult.endTime || null
              },
              output: {
                text: toolResult.output || toolResult.text || '',
                data: toolResult.data || null,
                error: toolResult.error || null,
                exitCode: toolResult.exitCode || null
              },
              context: {
                workingDirectory: toolResult.workingDirectory || toolResult.cwd || null,
                environment: toolResult.environment || null,
                arguments: toolResult.arguments || toolResult.args || null,
                command: toolResult.command || null
              }
            }
            
            // Apply tool filter if specified
            if (!toolFilter || result.tool.name.toLowerCase().includes(toolFilter.toLowerCase())) {
              toolResults.push(result)
            }
          }
        }
      } catch (e) {
        // Skip invalid bubbles
      }
    }

    // Sort by rowId (chronological order)
    toolResults.sort((a, b) => a.rowId - b.rowId)

    // Apply limit
    const limitedResults = toolResults.slice(-limit)

    // Filter by 'since' parameter if provided
    let filteredResults = limitedResults
    if (since) {
      if (since.includes('T')) {
        // ISO timestamp
        const sinceDate = new Date(since)
        filteredResults = limitedResults.filter(result => new Date(result.timestamp) > sinceDate)
      } else {
        // Bubble ID
        const sinceIndex = limitedResults.findIndex(result => result.bubbleId === since)
        if (sinceIndex >= 0) {
          filteredResults = limitedResults.slice(sinceIndex + 1)
        }
      }
    }

    await db.close()

    // Generate summary statistics
    const toolStats = new Map<string, number>()
    const successCount = filteredResults.filter(r => r.execution.success).length
    const errorCount = filteredResults.filter(r => !r.execution.success).length
    
    for (const result of filteredResults) {
      const toolName = result.tool.name
      toolStats.set(toolName, (toolStats.get(toolName) || 0) + 1)
    }

    const response = {
      toolResults: filteredResults,
      metadata: {
        totalResults: filteredResults.length,
        totalBubbles: recentBubbles.length,
        successCount,
        errorCount,
        successRate: filteredResults.length > 0 ? (successCount / filteredResults.length * 100).toFixed(1) + '%' : '0%',
        toolStats: Object.fromEntries(toolStats),
        lastBubbleId: filteredResults.length > 0 ? filteredResults[filteredResults.length - 1].bubbleId : null,
        timestamp: new Date().toISOString(),
        globalDbPath,
        toolFilter
      }
    }

    // Return different formats based on request
    if (format === 'text') {
      const textOutput = filteredResults.map(result => {
        let output = `🔧 TOOL: ${result.tool.name}`
        output += `\n📅 Time: ${result.timestamp}`
        output += `\n${result.execution.success ? '✅' : '❌'} Status: ${result.execution.success ? 'Success' : 'Failed'}`
        if (result.execution.duration) output += ` (${result.execution.duration}ms)`
        if (result.context.command) output += `\n💻 Command: ${result.context.command}`
        if (result.context.workingDirectory) output += `\n📁 Directory: ${result.context.workingDirectory}`
        output += `\n📤 Output:\n${result.output.text || 'No output'}`
        if (result.output.error) output += `\n❌ Error: ${result.output.error}`
        
        return output
      }).join('\n\n' + '='.repeat(80) + '\n\n')
      
      return new Response(textOutput, {
        headers: { 'Content-Type': 'text/plain' }
      })
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Tool Results API error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      toolResults: [],
      metadata: {}
    }, { status: 500 })
  }
} 
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, MessageSquare, User, Bot, ExternalLink } from "lucide-react"
import Link from "next/link"

interface Message {
  id: string
  type: 'user' | 'assistant' | 'unknown'
  text: string
  timestamp?: string
  hasCodeBlocks?: boolean
  hasToolResults?: boolean
  hasAttachedFiles?: boolean
  isAgentic?: boolean
  capabilities?: string[]
  metadata?: {
    hasContent: {
      text: boolean
      codeBlocks: boolean
      toolResults: boolean
      attachedFiles: boolean
      gitDiffs: boolean
      lints: boolean
    }
    isAgentic: boolean
    tokenCount: number
    capabilities: string[]
    codeBlocks?: Array<{
      language: string
      code: string
      filename?: string
    }>
    toolResults?: Array<{
      tool: string
      output: string
      success: boolean
      duration?: number
    }>
    attachedFiles?: Array<{
      filename: string
      content: string
      startLine?: number
      endLine?: number
    }>
    gitDiffs?: Array<{
      filename: string
      diff: string
      type: string
    }>
    lints?: Array<{
      filename: string
      message: string
      severity: string
      line?: number
    }>
  }
}

interface ActiveChat {
  chatId: string
  title: string
  messageCount: number
  totalBubbles: number
  lastActivity: string
  messages: Message[]
  metadata: {
    globalDbPath: string
    totalConversations: number
    recentBubblesChecked: number
  }
}

export default function ActiveChatPage() {
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchActiveChat = async () => {
    try {
      // Try enhanced API first, fallback to basic if needed
      let response = await fetch('/api/recent-messages-enhanced?limit=20&metadataLevel=full')
      let isEnhanced = true
      
      if (!response.ok) {
        // Fallback to basic API
        response = await fetch('/api/active-chat')
        isEnhanced = false
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Transform enhanced API response to match our interface
      if (isEnhanced && data.messages) {
        const transformedData = {
          chatId: data.chatId,
          title: `Enhanced Chat (${data.messages.length} messages)`,
          messageCount: data.messages.length,
          totalBubbles: data.metadata.totalBubbles,
          lastActivity: data.metadata.timestamp,
          messages: data.messages,
          metadata: {
            globalDbPath: data.metadata.globalDbPath,
            totalConversations: data.metadata.conversationCount,
            recentBubblesChecked: data.metadata.totalBubbles,
            isEnhanced: true,
            contentScore: data.metadata.contentScore
          }
        }
        setActiveChat(transformedData)
      } else {
        setActiveChat(data)
      }
      
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch active chat')
      console.error('Error fetching active chat:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActiveChat()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchActiveChat()
    }, 3000) // Refresh every 3 seconds

    return () => clearInterval(interval)
  }, [autoRefresh])

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Unknown time'
    try {
      return new Date(timestamp).toLocaleString()
    } catch {
      return 'Invalid time'
    }
  }

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <User className="h-4 w-4" />
      case 'assistant':
        return <Bot className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getMessageBgColor = (type: string) => {
    switch (type) {
      case 'user':
        return 'bg-blue-50 border-blue-200'
      case 'assistant':
        return 'bg-green-50 border-green-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading active chat...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error Loading Active Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={fetchActiveChat} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!activeChat) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No active chat found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Active Chat</h1>
          <p className="text-gray-600">{activeChat.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchActiveChat}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/api-docs">
              <ExternalLink className="h-4 w-4 mr-2" />
              API Docs
            </Link>
          </Button>
        </div>
      </div>

      {/* Chat Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Chat Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Chat ID</p>
              <p className="font-mono text-sm">{activeChat.chatId.slice(0, 8)}...</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Messages</p>
              <p className="font-semibold">
                {activeChat.messages.filter(m => m.text && m.text.length > 0).length} / {activeChat.messageCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Bubbles</p>
              <p className="font-semibold">{activeChat.totalBubbles}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Activity</p>
              <p className="text-sm">{formatTimestamp(activeChat.lastActivity)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <div className="space-y-4">
        {activeChat.messages
          .filter(message => message.text && message.text.length > 0) // Only show messages with text
          .reverse() // Reverse to chronological order first
          .slice(-20) // Then get the last 20 (most recent)
          .map((message, index) => (
          <Card key={message.id || index} className={`${getMessageBgColor(message.type)} border`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getMessageIcon(message.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant={message.type === 'user' ? 'default' : 'secondary'}>
                      {message.type}
                    </Badge>
                    {(message.isAgentic || message.metadata?.isAgentic) && (
                      <Badge variant="outline">🤖 Agentic</Badge>
                    )}
                    {(message.hasCodeBlocks || message.metadata?.hasContent.codeBlocks) && (
                      <Badge variant="outline">💻 Code</Badge>
                    )}
                    {(message.hasToolResults || message.metadata?.hasContent.toolResults) && (
                      <Badge variant="outline">🔧 Tools</Badge>
                    )}
                    {(message.hasAttachedFiles || message.metadata?.hasContent.attachedFiles) && (
                      <Badge variant="outline">📎 Files</Badge>
                    )}
                    {message.metadata?.hasContent.gitDiffs && (
                      <Badge variant="outline">📊 Git</Badge>
                    )}
                    {message.metadata?.hasContent.lints && (
                      <Badge variant="outline">⚠️ Lints</Badge>
                    )}
                    {message.metadata?.tokenCount && message.metadata.tokenCount > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {message.metadata.tokenCount} tokens
                      </Badge>
                    )}
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm bg-white/50 p-3 rounded border text-gray-900 dark:text-gray-100">
                      {message.text || '(No text content)'}
                    </pre>
                  </div>
                  {/* Enhanced Metadata Display */}
                  {message.metadata && (
                    <div className="mt-3 space-y-2">
                      {/* Code Blocks */}
                      {message.metadata.codeBlocks && message.metadata.codeBlocks.length > 0 && (
                        <details className="bg-white/70 rounded border p-2">
                          <summary className="cursor-pointer text-xs font-medium text-gray-700">
                            💻 Code Blocks ({message.metadata.codeBlocks.length})
                          </summary>
                          <div className="mt-2 space-y-2">
                            {message.metadata.codeBlocks.map((block, i) => (
                              <div key={i} className="bg-gray-50 rounded p-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">{block.language}</Badge>
                                  {block.filename && (
                                    <span className="text-xs text-gray-600">{block.filename}</span>
                                  )}
                                </div>
                                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                                  {block.code.substring(0, 200)}{block.code.length > 200 ? '...' : ''}
                                </pre>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}

                      {/* Tool Results */}
                      {message.metadata.toolResults && message.metadata.toolResults.length > 0 && (
                        <details className="bg-white/70 rounded border p-2">
                          <summary className="cursor-pointer text-xs font-medium text-gray-700">
                            🔧 Tool Results ({message.metadata.toolResults.length})
                          </summary>
                          <div className="mt-2 space-y-2">
                            {message.metadata.toolResults.map((result, i) => (
                              <div key={i} className="bg-gray-50 rounded p-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">{result.tool}</Badge>
                                  <Badge variant={result.success ? "default" : "destructive"} className="text-xs">
                                    {result.success ? '✅' : '❌'}
                                  </Badge>
                                  {result.duration && (
                                    <span className="text-xs text-gray-600">{result.duration}ms</span>
                                  )}
                                </div>
                                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                                  {result.output.substring(0, 200)}{result.output.length > 200 ? '...' : ''}
                                </pre>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}

                      {/* Attached Files */}
                      {message.metadata.attachedFiles && message.metadata.attachedFiles.length > 0 && (
                        <details className="bg-white/70 rounded border p-2">
                          <summary className="cursor-pointer text-xs font-medium text-gray-700">
                            📎 Attached Files ({message.metadata.attachedFiles.length})
                          </summary>
                          <div className="mt-2 space-y-2">
                            {message.metadata.attachedFiles.map((file, i) => (
                              <div key={i} className="bg-gray-50 rounded p-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium">{file.filename}</span>
                                  {file.startLine && (
                                    <span className="text-xs text-gray-600">
                                      Lines {file.startLine}-{file.endLine}
                                    </span>
                                  )}
                                </div>
                                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                                  {file.content.substring(0, 200)}{file.content.length > 200 ? '...' : ''}
                                </pre>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}

                      {/* Git Diffs */}
                      {message.metadata.gitDiffs && message.metadata.gitDiffs.length > 0 && (
                        <details className="bg-white/70 rounded border p-2">
                          <summary className="cursor-pointer text-xs font-medium text-gray-700">
                            📊 Git Changes ({message.metadata.gitDiffs.length})
                          </summary>
                          <div className="mt-2 space-y-2">
                            {message.metadata.gitDiffs.map((diff, i) => (
                              <div key={i} className="bg-gray-50 rounded p-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium">{diff.filename}</span>
                                  <Badge variant="outline" className="text-xs">{diff.type}</Badge>
                                </div>
                                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                                  {diff.diff.substring(0, 200)}{diff.diff.length > 200 ? '...' : ''}
                                </pre>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}

                      {/* Lint Issues */}
                      {message.metadata.lints && message.metadata.lints.length > 0 && (
                        <details className="bg-white/70 rounded border p-2">
                          <summary className="cursor-pointer text-xs font-medium text-gray-700">
                            ⚠️ Lint Issues ({message.metadata.lints.length})
                          </summary>
                          <div className="mt-2 space-y-1">
                            {message.metadata.lints.map((lint, i) => (
                              <div key={i} className="bg-gray-50 rounded p-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium">{lint.filename}</span>
                                  <Badge variant="outline" className="text-xs">{lint.severity}</Badge>
                                  {lint.line && (
                                    <span className="text-xs text-gray-600">Line {lint.line}</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-700">{lint.message}</p>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  )}

                  {/* Legacy Capabilities Display */}
                  {(message.capabilities && message.capabilities.length > 0) && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-1">Capabilities:</p>
                      <div className="flex flex-wrap gap-1">
                        {message.capabilities.map((cap, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {cap}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* API Info */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm text-blue-800">🚀 Programmatic Access</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-700 text-sm mb-3">
            You can access this chat data programmatically using our API! Perfect for automation, monitoring, or building custom integrations.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/api/recent-messages?limit=5" target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                Try API
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/api-docs">
                View Documentation
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Debug Info */}
      <Card className="mt-6 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-sm">Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-gray-600 space-y-1">
            <p>Database: {activeChat.metadata.globalDbPath}</p>
            <p>Total Conversations: {activeChat.metadata.totalConversations}</p>
            <p>Recent Bubbles Checked: {activeChat.metadata.recentBubblesChecked}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
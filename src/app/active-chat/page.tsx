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
  hasCodeBlocks: boolean
  hasToolResults: boolean
  hasAttachedFiles: boolean
  isAgentic: boolean
  capabilities: string[]
  rawKeys: string[]
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
      const response = await fetch('/api/active-chat')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setActiveChat(data)
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
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={message.type === 'user' ? 'default' : 'secondary'}>
                      {message.type}
                    </Badge>
                    {message.isAgentic && (
                      <Badge variant="outline">Agentic</Badge>
                    )}
                    {message.hasCodeBlocks && (
                      <Badge variant="outline">Code</Badge>
                    )}
                    {message.hasToolResults && (
                      <Badge variant="outline">Tools</Badge>
                    )}
                    {message.hasAttachedFiles && (
                      <Badge variant="outline">Files</Badge>
                    )}
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm bg-white/50 p-3 rounded border text-gray-900 dark:text-gray-100">
                      {message.text || '(No text content)'}
                    </pre>
                  </div>
                  {message.capabilities.length > 0 && (
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
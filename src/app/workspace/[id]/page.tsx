"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Loading } from "@/components/ui/loading"
import { DownloadMenu } from "@/components/download-menu"
import ReactMarkdown from "react-markdown"
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { ChatTab, Workspace } from "@/types/workspace"

interface WorkspaceState {
  workspace: Workspace | null;
  tabs: ChatTab[];
  selectedTabId: string | null;
  isLoading: boolean;
}

export default function WorkspacePage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams()
  const [state, setState] = useState<WorkspaceState>({
    workspace: null,
    tabs: [],
    selectedTabId: null,
    isLoading: true
  })

  // Get initial tab ID from URL
  const initialTabId = useMemo(() => searchParams.get('tab'), [])

  // Single fetch function for all workspace data
  const fetchWorkspaceData = useCallback(async () => {
    try {
      const [workspaceRes, tabsRes] = await Promise.all([
        fetch(`/api/workspaces/${params.id}`),
        fetch(`/api/workspaces/${params.id}/tabs`)
      ])

      const [workspace, tabs] = await Promise.all([
        workspaceRes.json(),
        tabsRes.json()
      ])

      // Find the requested tab, or default to first tab
      let selectedId = null
      if (initialTabId) {
        const requestedTab = tabs.find((t: ChatTab) => t.id === initialTabId)
        if (requestedTab) {
          selectedId = requestedTab.id
        }
      }
      
      // If no valid tab ID, use first tab
      if (!selectedId && tabs.length > 0) {
        selectedId = tabs[0].id
        // Update URL without triggering navigation
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.set('tab', selectedId)
        window.history.replaceState({}, '', newUrl)
      }

      setState({
        workspace,
        tabs,
        selectedTabId: selectedId,
        isLoading: false
      })
    } catch (error) {
      console.error('Failed to fetch workspace data:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [params.id, initialTabId]) // Only depend on params.id and initial tab ID

  // Fetch data only once when component mounts
  useEffect(() => {
    fetchWorkspaceData()
  }, [fetchWorkspaceData])

  const handleTabSelect = useCallback((tabId: string) => {
    setState(prev => ({ ...prev, selectedTabId: tabId }))
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('tab', tabId)
    window.history.replaceState({}, '', newUrl)
  }, []) // No dependencies needed

  if (state.isLoading) {
    return <Loading message="Loading workspace..." />
  }

  const selectedTab = state.tabs.find(tab => tab.id === state.selectedTabId)

  return (
    <div className="space-y-6">
      {/* Back Button and Title Row */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/">
            <ArrowLeft className="w-4 h-4" />
            Back to Workspaces
          </Link>
        </Button>
        {selectedTab && <DownloadMenu tab={selectedTab} />}
      </div>

      {/* Workspace Info */}
      {state.workspace?.folder && (
        <div className="bg-muted/50 dark:bg-muted/10 p-6 rounded-lg border">
          <h2 className="font-semibold mb-2">Workspace Location</h2>
          <p className="text-sm text-muted-foreground">{state.workspace.folder}</p>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Tabs List */}
        <div className="col-span-3 space-y-4">
          <h2 className="text-2xl font-bold mb-6">Chat Tabs</h2>
          <div className="space-y-2">
            {state.tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={selectedTab?.id === tab.id ? "default" : "outline"}
                className="w-full justify-start px-4 py-3 h-auto"
                onClick={() => handleTabSelect(tab.id)}
                title={tab.title}
              >
                <div className="text-left w-full">
                  <div className="font-medium truncate">
                    {tab.title || `Chat ${tab.id.slice(0, 8)}`}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(tab.timestamp).toLocaleString()}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Chat Content */}
        <div className="col-span-9">
          {selectedTab ? (
            <Card className="p-6">
              <div className="space-y-6">
                {selectedTab.bubbles.map((bubble, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg border ${
                      bubble.type === 'ai' 
                        ? 'bg-muted/50 dark:bg-muted/10' 
                        : 'bg-background'
                    }`}
                  >
                    <div className="font-semibold mb-3 text-foreground">
                      {bubble.type === 'ai' ? `AI (${bubble.modelType})` : 'User'}
                    </div>
                    {bubble.selections?.length > 0 && (
                      <div className="mb-4">
                        <div className="font-medium text-sm text-muted-foreground mb-2">
                          Selections:
                        </div>
                        {bubble.selections.map((selection, idx) => (
                          <pre 
                            key={idx} 
                            className="bg-muted/50 dark:bg-muted/10 mt-2 text-sm"
                          >
                            <code>{selection.text}</code>
                          </pre>
                        ))}
                      </div>
                    )}
                    {bubble.text && (
                      <div className="rounded-lg overflow-hidden">
                        <ReactMarkdown
                          className="prose dark:prose-invert max-w-none"
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({node, inline, className, children, ...props}) {
                              const match = /language-(\w+)/.exec(className || '')
                              const language = match ? match[1] : null
                              
                              if (inline) {
                                return <code className={className} {...props}>{children}</code>
                              }

                              return (
                                <SyntaxHighlighter
                                  style={vscDarkPlus}
                                  language={language || 'text'}
                                  PreTag="div"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              )
                            }
                          }}
                        >
                          {bubble.text}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <div className="text-center text-muted-foreground mt-8">
              Select a tab to view the chat
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
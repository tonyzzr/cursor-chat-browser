"use client"

import { useEffect, useState } from 'react'
import { ComposerChat } from '@/types/workspace'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { Loading } from "@/components/ui/loading"
import { DownloadMenu } from "@/components/download-menu"

interface ComposerDetailProps {
  params: {
    id: string
  }
}

interface CodeProps {
  className?: string;
  children: string;
}

export default function ComposerDetail({ params }: ComposerDetailProps) {
  const [composer, setComposer] = useState<ComposerChat | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchComposer = async () => {
      try {
        const response = await fetch(`/api/composers/${params.id}`)
        const data = await response.json()
        setComposer(data)
      } catch (error) {
        console.error('Failed to fetch composer:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchComposer()
  }, [params.id])

  if (isLoading) {
    return <Loading message="Loading composer log..." />
  }

  if (!composer) {
    return <div>Composer not found</div>
  }

  // Convert composer data to ChatTab format for DownloadMenu
  const composerTab = {
    id: composer.composerId,
    title: composer.text || 'Untitled',
    timestamp: composer.lastUpdatedAt ? new Date(composer.lastUpdatedAt).toISOString() : new Date().toISOString(),
    bubbles: composer.conversation.map(msg => ({
      type: msg.type === 1 ? 'user' : 'ai',
      text: msg.text,
      modelType: msg.type === 2 ? 'Composer Assistant' : undefined,
      selections: msg.context?.selections || []
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/composer">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <DownloadMenu tab={composerTab} />
      </div>

      <div className="space-y-4">
        {composer.conversation.map((message) => (
          <Card key={message.bubbleId} className="p-4">
            <div className="font-semibold mb-3 text-foreground">
              {message.type === 1 ? 'User' : 'AI'}
            </div>
            {message.context?.selections?.length > 0 && (
              <div className="mb-4">
                <div className="font-medium text-sm text-muted-foreground mb-2">
                  Selections:
                </div>
                {message.context.selections.map((selection, idx) => (
                  <pre 
                    key={idx} 
                    className="bg-muted/50 dark:bg-muted/10 mt-2 text-sm"
                  >
                    <code>{selection.text}</code>
                  </pre>
                ))}
              </div>
            )}
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }: CodeProps) {
                    const match = /language-(\w+)/.exec(className || '')
                    return match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 
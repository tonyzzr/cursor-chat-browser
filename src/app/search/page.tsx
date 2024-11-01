"use client"

import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Card } from "@/components/ui/card"
import { Loading } from "@/components/ui/loading"

interface SearchResult {
  workspaceId: string
  workspaceFolder: string
  chatId: string
  chatTitle: string
  timestamp: string | number
  matchingText: string
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const searchChats = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await response.json()
        setResults(data)
      } catch (error) {
        console.error('Failed to search:', error)
      } finally {
        setLoading(false)
      }
    }

    if (query) {
      searchChats()
    }
  }, [query])

  if (loading) {
    return <Loading message="Searching chat logs..." />
  }

  if (!query) {
    return <div className="text-center text-muted-foreground mt-8">Enter a search term to find chat logs</div>
  }

  const formatDate = (timestamp: string | number) => {
    try {
      // Handle both string dates and numeric timestamps
      const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp)
      return format(date, 'PPp')
    } catch {
      return 'Unknown date'
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Search Results for &ldquo;{query}&rdquo;
        <span className="text-muted-foreground ml-2 text-lg">
          ({results.length} {results.length === 1 ? 'result' : 'results'})
        </span>
      </h1>

      <div className="space-y-4">
        {results.map((result, index) => (
          <Card key={index} className="p-4 hover:bg-muted/50">
            <Link 
              href={`/workspace/${result.workspaceId}?tab=${result.chatId}`}
              className="block space-y-2"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{result.chatTitle}</h2>
                <time className="text-sm text-muted-foreground">
                  {formatDate(result.timestamp)}
                </time>
              </div>
              
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span>📁</span>
                <span className="truncate">{result.workspaceFolder}</span>
              </div>

              <p className="text-sm mt-2">
                {result.matchingText}
              </p>
            </Link>
          </Card>
        ))}

        {results.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No results found for &ldquo;{query}&rdquo;
          </div>
        )}
      </div>
    </div>
  )
} 
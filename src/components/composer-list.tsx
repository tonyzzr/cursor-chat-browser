"use client"

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ComposerChat } from '@/types/workspace'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loading } from "@/components/ui/loading"

interface ComposerWithWorkspace extends ComposerChat {
  workspaceId: string;
  workspaceFolder?: string;
}

export function ComposerList() {
  const [composers, setComposers] = useState<ComposerWithWorkspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchComposers = async () => {
      try {
        const response = await fetch('/api/composers')
        const data = await response.json()
        
        // Check if the response is an error
        if (!response.ok || data.error) {
          setError(data.error || 'Failed to fetch composers')
          return
        }
        
        // Ensure data is an array
        if (!Array.isArray(data)) {
          setError('Invalid response format')
          return
        }

        setComposers(data)
        setError(null)
      } catch (error) {
        console.error('Failed to fetch composers:', error)
        setError('Failed to fetch composers')
      } finally {
        setIsLoading(false)
      }
    }
    fetchComposers()
  }, [])

  if (isLoading) {
    return <Loading message="Loading agent logs..." />
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <p className="text-gray-600">
          Please check your workspace configuration in the{' '}
          <button 
            onClick={() => router.push('/config')}
            className="text-blue-600 hover:underline"
          >
            settings page
          </button>
        </p>
      </div>
    )
  }

  if (composers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No composer logs found.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Workspace Hash</TableHead>
            <TableHead>Folder</TableHead>
            <TableHead>Last Modified</TableHead>
            <TableHead className="text-right">Messages</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {composers.map((composer) => (
            <TableRow key={composer.composerId} className="hover:bg-accent/50">
              <TableCell>
                <Link 
                  href={`/workspace/${composer.workspaceId}?tab=${composer.composerId}&type=composer`}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {composer.workspaceId}
                </Link>
              </TableCell>
              <TableCell>
                {composer.workspaceFolder ? (
                  <div className="flex items-start space-x-2">
                    <span className="text-gray-500 mt-1">📁</span>
                    <span 
                      className="break-all text-sm"
                      title={composer.workspaceFolder}
                    >
                      {composer.workspaceFolder}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400 italic">No folder</span>
                )}
              </TableCell>
              <TableCell>
                {format(composer.lastUpdatedAt || composer.createdAt || Date.now(), 'PPP p')}
              </TableCell>
              <TableCell className="text-right">
                {composer.conversation?.length || 0}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 
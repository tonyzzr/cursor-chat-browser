"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Workspace } from "@/types/workspace"
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

interface WorkspaceWithCounts extends Workspace {
  composerCount: number;
}

export function WorkspaceList() {
  const [workspaces, setWorkspaces] = useState<WorkspaceWithCounts[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await fetch('/api/workspaces')
        const data = await response.json()
        
        // Check if the response is an error
        if (!response.ok || data.error) {
          setError(data.error || 'Failed to fetch workspaces')
          return
        }
        
        // Ensure data is an array
        if (!Array.isArray(data)) {
          setError('Invalid response format')
          return
        }
        
        // For new format (chatCount = -1), don't fetch individual composer counts
        // to avoid processing the global database multiple times
        const workspacesWithCounts = data.map((workspace: Workspace) => ({
          ...workspace,
          composerCount: 0 // We'll show this in the UI differently for new format
        }))
        
        setWorkspaces(workspacesWithCounts)
        setError(null)
      } catch (error) {
        console.error('Failed to fetch workspaces:', error)
        setError('Failed to fetch workspaces')
      } finally {
        setLoading(false)
      }
    }

    fetchWorkspaces()
  }, [])

  const handleWorkspaceClick = (workspaceId: string) => {
    router.push(`/workspace/${workspaceId}`)
  }

  if (loading) {
    return <Loading message="Loading workspaces..." />
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

  if (workspaces.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No workspaces with chat history found.</p>
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
            <TableHead className="text-right">Ask Logs</TableHead>
            <TableHead className="text-right">Agent Logs</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workspaces
            .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
            .filter(workspace => workspace.chatCount > 0 || workspace.chatCount === -1 || workspace.composerCount > 0)
            .map((workspace) => (
              <TableRow key={workspace.id} className="hover:bg-accent/50">
                <TableCell>
                  <button 
                    onClick={() => handleWorkspaceClick(workspace.id)}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {workspace.id}
                  </button>
                </TableCell>
                <TableCell>
                  {workspace.folder ? (
                    <div className="flex items-start space-x-2">
                      <span className="text-gray-500 mt-1">📁</span>
                      <span 
                        className="break-all text-sm"
                        title={workspace.folder}
                      >
                        {workspace.folder}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">No folder</span>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(workspace.lastModified), 'PPP p')}
                </TableCell>
                <TableCell className="text-right">
                  {workspace.chatCount === -1 ? '✓' : workspace.chatCount}
                </TableCell>
                <TableCell className="text-right">
                  {workspace.composerCount}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  )
} 
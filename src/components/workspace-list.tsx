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
  const router = useRouter()

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await fetch('/api/workspaces')
        const data = await response.json()
        
        // Fetch composer counts for each workspace
        const workspacesWithCounts = await Promise.all(
          data.map(async (workspace: Workspace) => {
            const tabsRes = await fetch(`/api/workspaces/${workspace.id}/tabs`)
            const tabsData = await tabsRes.json()
            const composerCount = tabsData.composers?.allComposers?.length || 0
            return {
              ...workspace,
              composerCount
            }
          })
        )
        
        setWorkspaces(workspacesWithCounts)
      } catch (error) {
        console.error('Failed to fetch workspaces:', error)
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Workspace Hash</TableHead>
            <TableHead>Folder</TableHead>
            <TableHead>Last Modified</TableHead>
            <TableHead className="text-right">Chat Logs</TableHead>
            <TableHead className="text-right">Composer Logs</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workspaces
            .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
            .filter(workspace => workspace.chatCount > 0 || workspace.composerCount > 0)
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
                  {workspace.chatCount}
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
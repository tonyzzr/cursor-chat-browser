"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import Link from "next/link"
import { Workspace } from "@/types/workspace"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loading } from "@/components/ui/loading"
import { useRouter } from 'next/navigation'

export function WorkspaceList() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await fetch('/api/workspaces')
        const data = await response.json()
        setWorkspaces(data)
      } catch (error) {
        console.error('Failed to fetch workspaces:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkspaces()
  }, [])

  const handleWorkspaceClick = async (workspaceId: string) => {
    try {
      const tabs = await fetch(`/api/workspaces/${workspaceId}/tabs`).then(r => r.json())
      if (tabs.length > 0) {
        router.push(`/workspace/${workspaceId}?tab=${tabs[0].id}`)
      } else {
        router.push(`/workspace/${workspaceId}`)
      }
    } catch (error) {
      console.error('Failed to fetch tabs:', error)
      router.push(`/workspace/${workspaceId}`)
    }
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
            <TableHead className="text-right">Chats</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workspaces
            .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
            .filter(workspace => workspace.chatCount > 0)
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
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">📁</span>
                      <span className="truncate max-w-md" title={workspace.folder}>
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
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  )
} 
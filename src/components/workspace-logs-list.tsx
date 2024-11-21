"use client"

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loading } from "@/components/ui/loading"
import { Badge } from "@/components/ui/badge"

interface WorkspaceLog {
  id: string;
  workspaceId: string;
  workspaceFolder?: string;
  title: string;
  timestamp: number;
  type: 'chat' | 'composer';
  messageCount: number;
}

export function WorkspaceLogsList() {
  const [logs, setLogs] = useState<WorkspaceLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/logs')
        const data = await response.json()
        setLogs(data.logs || [])
      } catch (error) {
        console.error('Failed to fetch logs:', error)
        setLogs([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchLogs()
  }, [])

  if (isLoading) {
    return <Loading message="Loading logs..." />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Workspace</TableHead>
          <TableHead>Last Modified</TableHead>
          <TableHead className="text-right">Messages</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={`${log.type}-${log.id}`} className="hover:bg-accent/50">
            <TableCell>
              <Link 
                href={`/workspace/${log.workspaceId}?tab=${log.id}&type=${log.type}`}
                className="text-blue-600 hover:underline font-medium"
              >
                {log.title}
              </Link>
            </TableCell>
            <TableCell>
              <Badge variant={log.type === 'chat' ? 'default' : 'secondary'}>
                {log.type === 'chat' ? 'Chat Log' : 'Composer Log'}
              </Badge>
            </TableCell>
            <TableCell>
              {log.workspaceFolder ? (
                <div className="flex items-start space-x-2">
                  <span className="text-gray-500 mt-1">📁</span>
                  <span 
                    className="break-all text-sm"
                    title={log.workspaceFolder}
                  >
                    {log.workspaceFolder}
                  </span>
                </div>
              ) : (
                <span className="text-gray-400 italic">No folder</span>
              )}
            </TableCell>
            <TableCell>
              {format(new Date(log.timestamp), 'PPp')}
            </TableCell>
            <TableCell className="text-right">
              {log.messageCount}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
} 
"use client"

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
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
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/logs')
        const data = await response.json()
        
        // Check if the response is an error
        if (!response.ok || data.error) {
          setError(data.error || 'Failed to fetch logs')
          return
        }
        
        setLogs(data.logs || [])
        setError(null)
      } catch (error) {
        console.error('Failed to fetch logs:', error)
        setError('Failed to fetch logs')
      } finally {
        setIsLoading(false)
      }
    }
    fetchLogs()
  }, [])

  if (isLoading) {
    return <Loading message="Loading logs..." />
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

  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No logs found.</p>
      </div>
    )
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
                {log.type === 'chat' ? 'Ask Log' : 'Agent Log'}
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
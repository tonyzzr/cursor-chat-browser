import { WorkspaceLogsList } from "@/components/workspace-logs-list"

export default function WorkspacesPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">All Cursor Logs</h1>
      <WorkspaceLogsList />
    </div>
  )
} 
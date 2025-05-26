import { WorkspaceList } from "@/components/workspace-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Workspaces</h1>
        <Button asChild>
          <Link href="/active-chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            View Active Chat
          </Link>
        </Button>
      </div>
      
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">🎉 New Feature: Active Chat Viewer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-700 mb-3">
            You can now view your current active Cursor chat conversation in real-time! 
            This shows the ongoing conversation from your current Cursor session.
          </p>
          <Button variant="outline" asChild>
            <Link href="/active-chat">
              <MessageSquare className="h-4 w-4 mr-2" />
              Try Active Chat Viewer
            </Link>
          </Button>
        </CardContent>
      </Card>
      
      <WorkspaceList />
    </div>
  )
} 
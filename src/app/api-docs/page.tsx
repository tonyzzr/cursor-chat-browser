'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Code, ExternalLink, Copy } from "lucide-react"
import Link from "next/link"

export default function ApiDocsPage() {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">API Documentation</h1>
        <p className="text-gray-600">
          Access your active Cursor chat conversations programmatically
        </p>
      </div>

      {/* API Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Available APIs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-md p-4">
              <h4 className="font-semibold mb-2">📝 Recent Messages</h4>
              <p className="text-sm text-gray-600 mb-2">
                Get recent chat messages with basic metadata
              </p>
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">/api/recent-messages</code>
            </div>
            <div className="border rounded-md p-4">
              <h4 className="font-semibold mb-2">🚀 Enhanced Messages</h4>
              <p className="text-sm text-gray-600 mb-2">
                Full chat data with rich metadata, tool results, code blocks
              </p>
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">/api/recent-messages-enhanced</code>
            </div>
            <div className="border rounded-md p-4">
              <h4 className="font-semibold mb-2">🔧 Tool Results</h4>
              <p className="text-sm text-gray-600 mb-2">
                Extract tool execution results and command outputs
              </p>
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">/api/tool-results</code>
            </div>
            <div className="border rounded-md p-4">
              <h4 className="font-semibold mb-2">💻 Code Blocks</h4>
              <p className="text-sm text-gray-600 mb-2">
                Get code snippets with language detection and metadata
              </p>
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">/api/code-blocks</code>
            </div>
            <div className="border rounded-md p-4">
              <h4 className="font-semibold mb-2">📁 File Context</h4>
              <p className="text-sm text-gray-600 mb-2">
                Track attached files, git changes, and file references
              </p>
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">/api/file-context</code>
            </div>
            <div className="border rounded-md p-4">
              <h4 className="font-semibold mb-2">👁️ Active Chat</h4>
              <p className="text-sm text-gray-600 mb-2">
                Real-time view of current conversation (web interface)
              </p>
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">/api/active-chat</code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Messages API */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Enhanced Messages API
            <Badge variant="secondary">NEW</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Endpoint</h3>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md font-mono text-sm flex items-center justify-between">
              <span>GET /api/recent-messages-enhanced</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => copyToClipboard(`${baseUrl}/api/recent-messages-enhanced`)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-600">
              Enhanced version that includes all the rich metadata we discovered: tool results, code blocks, 
              attached files, git diffs, lint results, context pieces, and more. Provides three metadata levels 
              (basic, full, raw) to control the amount of data returned.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Additional Parameters</h3>
            <div className="space-y-3">
              <div className="border rounded-md p-3">
                <div className="flex items-center gap-2 mb-1">
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">metadataLevel</code>
                  <Badge variant="outline">optional</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Metadata detail level: <code>basic</code>, <code>full</code> (default), or <code>raw</code>
                </p>
              </div>
              
              <div className="border rounded-md p-3">
                <div className="flex items-center gap-2 mb-1">
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">includeMetadata</code>
                  <Badge variant="outline">optional</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Include metadata in response (default: true)
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Try It Now</h3>
            <div className="flex gap-2 flex-wrap">
              <Button asChild size="sm">
                <Link href="/api/recent-messages-enhanced?limit=2&metadataLevel=basic" target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Basic Metadata
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/api/recent-messages-enhanced?limit=2&metadataLevel=full" target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Full Metadata
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/api/recent-messages-enhanced?format=text&limit=2" target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Text Format
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tool Results API */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Tool Results API
            <Badge variant="secondary">NEW</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Endpoint</h3>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md font-mono text-sm flex items-center justify-between">
              <span>GET /api/tool-results</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => copyToClipboard(`${baseUrl}/api/tool-results`)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-600">
              Extract tool execution results from chat bubbles. See command outputs, execution times, 
              success/failure status, and working directories. Perfect for monitoring AI tool usage.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Parameters</h3>
            <div className="space-y-3">
              <div className="border rounded-md p-3">
                <div className="flex items-center gap-2 mb-1">
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">tool</code>
                  <Badge variant="outline">optional</Badge>
                </div>
                <p className="text-sm text-gray-600">Filter by tool name (e.g., "terminal", "file_editor")</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Try It Now</h3>
            <div className="flex gap-2 flex-wrap">
              <Button asChild size="sm">
                <Link href="/api/tool-results?limit=5" target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Recent Tools
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/api/tool-results?format=text&limit=3" target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Text Format
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Blocks API */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Code Blocks API
            <Badge variant="secondary">NEW</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Endpoint</h3>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md font-mono text-sm flex items-center justify-between">
              <span>GET /api/code-blocks</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => copyToClipboard(`${baseUrl}/api/code-blocks`)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-600">
              Extract code blocks from conversations with language detection, line counts, and metadata. 
              Track AI-generated vs user-provided code, and see which files are being modified.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Parameters</h3>
            <div className="space-y-3">
              <div className="border rounded-md p-3">
                <div className="flex items-center gap-2 mb-1">
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">language</code>
                  <Badge variant="outline">optional</Badge>
                </div>
                <p className="text-sm text-gray-600">Filter by programming language (e.g., "typescript", "python")</p>
              </div>
              
              <div className="border rounded-md p-3">
                <div className="flex items-center gap-2 mb-1">
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">includeContent</code>
                  <Badge variant="outline">optional</Badge>
                </div>
                <p className="text-sm text-gray-600">Include actual code content (default: true)</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Try It Now</h3>
            <div className="flex gap-2 flex-wrap">
              <Button asChild size="sm">
                <Link href="/api/code-blocks?limit=5" target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Recent Code
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/api/code-blocks?language=typescript&limit=3" target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  TypeScript Only
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/api/code-blocks?includeContent=false&limit=10" target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Metadata Only
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Context API */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            File Context API
            <Badge variant="secondary">NEW</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Endpoint</h3>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md font-mono text-sm flex items-center justify-between">
              <span>GET /api/file-context</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => copyToClipboard(`${baseUrl}/api/file-context`)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-600">
              Track file interactions: attached files, git changes, recently viewed files, and context pieces. 
              Monitor which files are being referenced and modified during conversations.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Parameters</h3>
            <div className="space-y-3">
              <div className="border rounded-md p-3">
                <div className="flex items-center gap-2 mb-1">
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">type</code>
                  <Badge variant="outline">optional</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Context type: <code>attached</code>, <code>git</code>, <code>viewed</code>, <code>context</code>, or <code>all</code>
                </p>
              </div>
              
              <div className="border rounded-md p-3">
                <div className="flex items-center gap-2 mb-1">
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">file</code>
                  <Badge variant="outline">optional</Badge>
                </div>
                <p className="text-sm text-gray-600">Filter by filename pattern</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Try It Now</h3>
            <div className="flex gap-2 flex-wrap">
              <Button asChild size="sm">
                <Link href="/api/file-context?limit=10" target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  All Files
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/api/file-context?type=git&limit=5" target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Git Changes
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/api/file-context?type=attached&limit=5" target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Attached Files
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Messages API (Original) */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Recent Messages API (Basic)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Endpoint</h3>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md font-mono text-sm flex items-center justify-between">
              <span>GET /api/recent-messages</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => copyToClipboard(`${baseUrl}/api/recent-messages`)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-600">
              Retrieves the most recent messages from your active Cursor chat conversation in proper chronological order. 
              Messages are sequenced using SQLite rowid for guaranteed consistency - the same message will always appear 
              in the same position regardless of the limit parameter. Perfect for integrating with external tools, 
              monitoring, or building custom interfaces.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Query Parameters</h3>
            <div className="space-y-3">
              <div className="border rounded-md p-3">
                <div className="flex items-center gap-2 mb-1">
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">limit</code>
                  <Badge variant="outline">optional</Badge>
                </div>
                <p className="text-sm text-gray-600">Number of messages to return (default: 10, max: 50)</p>
              </div>
              
              <div className="border rounded-md p-3">
                <div className="flex items-center gap-2 mb-1">
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">since</code>
                  <Badge variant="outline">optional</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Get messages after this timestamp (ISO format) or bubble ID
                </p>
              </div>
              
              <div className="border rounded-md p-3">
                <div className="flex items-center gap-2 mb-1">
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">format</code>
                  <Badge variant="outline">optional</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Response format: <code>json</code> (default) or <code>text</code>
                </p>
              </div>
              
              <div className="border rounded-md p-3">
                <div className="flex items-center gap-2 mb-1">
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">includeEmpty</code>
                  <Badge variant="outline">optional</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Include messages without text content (default: false)
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Example Requests</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Get last 5 messages</h4>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md font-mono text-sm flex items-center justify-between">
                  <span>GET /api/recent-messages?limit=5</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(`${baseUrl}/api/recent-messages?limit=5`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Get messages as plain text</h4>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md font-mono text-sm flex items-center justify-between">
                  <span>GET /api/recent-messages?format=text&limit=3</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(`${baseUrl}/api/recent-messages?format=text&limit=3`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Get new messages since last check</h4>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md font-mono text-sm flex items-center justify-between">
                  <span>GET /api/recent-messages?since=2025-01-26T15:30:00Z</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(`${baseUrl}/api/recent-messages?since=2025-01-26T15:30:00Z`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Response Format (JSON)</h3>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md text-sm overflow-x-auto">
{`{
  "chatId": "669cab10-8b33-4d8c-934c-723d0d552245",
  "messages": [
    {
      "id": "a08b30b1-83e5-49c5-bd5a-23542870c543",
      "bubbleKey": "bubbleId:669cab10-...:a08b30b1-...",
      "rowId": 422944,
      "type": "user",
      "text": "Can you help me with this code?",
      "timestamp": "2025-01-26T15:30:00.000Z",
      "hasCodeBlocks": false,
      "hasToolResults": false,
      "hasAttachedFiles": true,
      "isAgentic": false,
      "capabilities": []
    },
    {
      "id": "b12c40d2-94f6-5e6d-ce7f-34653981ef54",
      "rowId": 422945,
      "type": "assistant",
      "text": "I'd be happy to help! Let me analyze your code...",
      "timestamp": "2025-01-26T15:30:15.000Z",
      "hasCodeBlocks": true,
      "hasToolResults": true,
      "isAgentic": true,
      "capabilities": ["code_analysis", "file_editing"]
    }
  ],
  "metadata": {
    "totalMessages": 2,
    "totalBubbles": 15,
    "conversationCount": 3,
    "lastBubbleId": "b12c40d2-94f6-5e6d-ce7f-34653981ef54",
    "timestamp": "2025-01-26T15:30:20.000Z"
  }
}`}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Try It Now</h3>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/api/recent-messages?limit=3" target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Test API (JSON)
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/api/recent-messages?format=text&limit=3" target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Test API (Text)
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Use Cases */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Use Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-md p-4">
              <h4 className="font-semibold mb-2">🤖 Chatbot Integration</h4>
              <p className="text-sm text-gray-600">
                Monitor your Cursor conversations and trigger actions in other systems
              </p>
            </div>
            <div className="border rounded-md p-4">
              <h4 className="font-semibold mb-2">📊 Analytics & Logging</h4>
              <p className="text-sm text-gray-600">
                Track your AI interactions and analyze conversation patterns
              </p>
            </div>
            <div className="border rounded-md p-4">
              <h4 className="font-semibold mb-2">🔄 Workflow Automation</h4>
              <p className="text-sm text-gray-600">
                Automatically process code suggestions and apply them to your projects
              </p>
            </div>
            <div className="border rounded-md p-4">
              <h4 className="font-semibold mb-2">📱 Custom Interfaces</h4>
              <p className="text-sm text-gray-600">
                Build your own chat viewers or mobile apps for Cursor conversations
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Code Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-2">JavaScript/Node.js</h4>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md text-sm overflow-x-auto">
{`// Get recent messages
const response = await fetch('http://localhost:3000/api/recent-messages?limit=5');
const data = await response.json();

console.log(\`Found \${data.messages.length} messages\`);
data.messages.forEach(msg => {
  console.log(\`[\${msg.type.toUpperCase()}] \${msg.text}\`);
});

// Poll for new messages
let lastBubbleId = null;
setInterval(async () => {
  const url = lastBubbleId 
    ? \`http://localhost:3000/api/recent-messages?since=\${lastBubbleId}\`
    : 'http://localhost:3000/api/recent-messages?limit=1';
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.messages.length > 0) {
    console.log('New messages:', data.messages);
    lastBubbleId = data.metadata.lastBubbleId;
  }
}, 5000); // Check every 5 seconds`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Python</h4>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md text-sm overflow-x-auto">
{`import requests
import time

def get_recent_messages(limit=5, since=None):
    url = "http://localhost:3000/api/recent-messages"
    params = {"limit": limit}
    if since:
        params["since"] = since
    
    response = requests.get(url, params=params)
    return response.json()

# Get recent messages
data = get_recent_messages(limit=3)
print(f"Found {len(data['messages'])} messages")

for msg in data['messages']:
    print(f"[{msg['type'].upper()}] {msg['text']}")

# Monitor for new messages
last_bubble_id = None
while True:
    data = get_recent_messages(since=last_bubble_id)
    if data['messages']:
        print("New messages:", len(data['messages']))
        last_bubble_id = data['metadata']['lastBubbleId']
    time.sleep(5)`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">curl</h4>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md text-sm overflow-x-auto">
{`# Get recent messages as JSON
curl "http://localhost:3000/api/recent-messages?limit=5"

# Get recent messages as plain text
curl "http://localhost:3000/api/recent-messages?format=text&limit=3"

# Get messages since a specific time
curl "http://localhost:3000/api/recent-messages?since=2025-01-26T15:30:00Z"`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
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

      {/* Recent Messages API */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Recent Messages API
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
              Retrieves the most recent messages from your active Cursor chat conversation. 
              Perfect for integrating with external tools, monitoring, or building custom interfaces.
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
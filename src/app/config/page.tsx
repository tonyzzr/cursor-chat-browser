"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Check } from "lucide-react"
import { useRouter } from "next/navigation"

// Function to get the Windows username through WSL or native Windows
async function getWindowsUsername(): Promise<string> {
  try {
    const response = await fetch('/api/get-username')
    const data = await response.json()
    return data.username || 'YOUR_USERNAME'
  } catch (error) {
    console.error('Failed to get username:', error)
    return 'YOUR_USERNAME'
  }
}

// Function to detect OS and WSL
async function detectEnvironment(): Promise<{ os: string, isWSL: boolean }> {
  try {
    const response = await fetch('/api/detect-environment')
    return await response.json()
  } catch (error) {
    console.error('Failed to detect environment:', error)
    return { os: 'unknown', isWSL: false }
  }
}

export default function ConfigPage() {
  const router = useRouter()
  const [config, setConfig] = useState({
    workspacePath: ''
  })
  const [username, setUsername] = useState<string>('YOUR_USERNAME')
  const [status, setStatus] = useState<{
    type: 'error' | 'success' | null;
    message: string;
  }>({ type: null, message: '' })

  useEffect(() => {
    const initConfig = async () => {
      // Get stored path or detect environment
      const storedPath = localStorage.getItem('workspacePath')
      if (storedPath) {
        setConfig({ workspacePath: storedPath })
        return
      }

      // Detect environment and set path
      const { os, isWSL } = await detectEnvironment()
      const detectedUsername = await getWindowsUsername()
      setUsername(detectedUsername)

      let detectedPath = ''
      if (isWSL) {
        detectedPath = `/mnt/c/Users/${detectedUsername}/AppData/Roaming/Cursor/User/workspaceStorage`
      } else if (os === 'win32') {
        detectedPath = `C:\\Users\\${detectedUsername}\\AppData\\Roaming\\Cursor\\User\\workspaceStorage`
      } else if (os === 'darwin') {
        detectedPath = '~/Library/Application Support/Cursor/User/workspaceStorage'
      } else if (os === 'linux') {
        detectedPath = '~/.config/Cursor/User/workspaceStorage'
      }

      // Try to validate the detected path
      if (detectedPath) {
        try {
          const response = await fetch('/api/validate-path', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path: detectedPath }),
          })

          const data = await response.json()

          if (data.valid) {
            // Path is valid, save it and redirect
            localStorage.setItem('workspacePath', detectedPath)
            document.cookie = `workspacePath=${encodeURIComponent(detectedPath)}; path=/`
            router.push('/')
            return
          }
        } catch (error) {
          console.error('Failed to validate detected path:', error)
        }
      }

      // If we get here, either no path was detected or validation failed
      setConfig({ workspacePath: detectedPath })
    }

    initConfig()
  }, [router])

  const validateAndSave = async () => {
    try {
      const response = await fetch('/api/validate-path', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: config.workspacePath }),
      })

      const data = await response.json()

      if (data.valid) {
        // Save to localStorage and cookies
        localStorage.setItem('workspacePath', config.workspacePath)
        document.cookie = `workspacePath=${encodeURIComponent(config.workspacePath)}; path=/`
        
        // Update server environment
        await fetch('/api/set-workspace', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ path: config.workspacePath }),
        })
        
        setStatus({
          type: 'success',
          message: `Found ${data.workspaceCount} workspaces in the specified location`
        })
      } else {
        setStatus({
          type: 'error',
          message: 'No workspaces found in the specified location'
        })
      }
    } catch {
      setStatus({
        type: 'error',
        message: 'Failed to validate path. Please check if the path exists and is accessible.'
      })
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Configuration</h1>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Cursor Workspace Path
          </label>
          <Input 
            value={config.workspacePath}
            onChange={(e) => setConfig({ ...config, workspacePath: e.target.value })}
            placeholder="/path/to/cursor/workspaces"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Path to your Cursor workspace storage directory
          </p>
        </div>

        <div className="flex gap-4">
          <Button onClick={validateAndSave}>
            Save Configuration
          </Button>
          
          {status.type === 'success' && (
            <Button variant="secondary" onClick={() => router.push('/chat')}>
              Go to Chat Logs
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 
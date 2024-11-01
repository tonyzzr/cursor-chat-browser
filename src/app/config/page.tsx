"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

export default function ConfigPage() {
  const [config, setConfig] = useState({
    workspacePath: localStorage.getItem('workspacePath') || ''
  })

  const saveConfig = () => {
    localStorage.setItem('workspacePath', config.workspacePath)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Configuration</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Cursor Workspace Path
          </label>
          <Input 
            value={config.workspacePath}
            onChange={(e) => setConfig({ ...config, workspacePath: e.target.value })}
            placeholder="/path/to/cursor/workspaces"
          />
          <p className="text-sm text-gray-500 mt-1">
            Path to your Cursor workspace storage directory
          </p>
        </div>

        <Button onClick={saveConfig}>
          Save Configuration
        </Button>
      </div>
    </div>
  )
} 
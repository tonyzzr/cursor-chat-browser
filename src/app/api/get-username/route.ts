import { NextResponse } from "next/server"
import { execSync } from 'child_process'
import os from 'os'

export async function GET() {
  try {
    let username = 'YOUR_USERNAME'

    if (process.platform === 'win32') {
      // Windows native
      username = process.env.USERNAME || os.userInfo().username
    } else {
      try {
        // Check if we're in WSL by trying to run a Windows command
        const output = execSync('cmd.exe /c echo %USERNAME%', { encoding: 'utf8' })
        username = output.trim()
      } catch {
        // Not in WSL, use regular Unix username
        username = os.userInfo().username
      }
    }

    return NextResponse.json({ username })
  } catch (error) {
    console.error('Failed to get username:', error)
    return NextResponse.json({ username: 'YOUR_USERNAME' })
  }
} 
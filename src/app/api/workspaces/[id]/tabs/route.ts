import { NextResponse } from "next/server"
import path from 'path'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { ChatTab } from "@/types/workspace"

interface RawTab {
  tabId: string;
  chatTitle: string;
  lastSendTime: number;
  bubbles: ChatBubble[];
  // ... other fields
}

const safeParseTimestamp = (timestamp: number | undefined): string => {
  try {
    if (!timestamp) {
      return new Date().toISOString();
    }
    return new Date(timestamp).toISOString();
  } catch (error) {
    console.error('Error parsing timestamp:', error, 'Raw value:', timestamp);
    return new Date().toISOString();
  }
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const workspacePath = process.env.WORKSPACE_PATH || ''
    const dbPath = path.join(workspacePath, params.id, 'state.vscdb')

    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    })

    const result = await db.get(`
      SELECT value FROM ItemTable 
      WHERE [key] IN ('workbench.panel.aichat.view.aichat.chatdata')
    `)

    await db.close()

    if (!result) {
      return NextResponse.json({ error: 'No chat data found' }, { status: 404 })
    }

    const chatData = JSON.parse(result.value)
    
    const tabs = chatData.tabs.map((tab: RawTab) => {
      const title = tab.chatTitle?.split('\n')[0] || `Chat ${tab.tabId.slice(0, 8)}`;
      
      return {
        id: tab.tabId,
        title: title,
        timestamp: safeParseTimestamp(tab.lastSendTime),
        bubbles: tab.bubbles
      };
    })
    
    return NextResponse.json(tabs)
  } catch (error) {
    console.error('Failed to get workspace tabs:', error)
    return NextResponse.json({ error: 'Failed to get workspace tabs' }, { status: 500 })
  }
} 
export interface Workspace {
  id: string
  path: string
  lastModified: Date
  chatCount: number
}

export interface ChatTab {
  id: string
  timestamp: number
  bubbles: ChatBubble[]
}

export interface ChatBubble {
  type: 'user' | 'ai'
  text?: string
  rawText?: string
  modelType?: string
  selections?: Array<{
    text: string
  }>
  image?: {
    path: string
  }
} 
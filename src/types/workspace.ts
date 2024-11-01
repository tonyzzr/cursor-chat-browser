export interface Selection {
  text: string;
}

export interface ChatBubble {
  type: 'ai' | 'user';
  text?: string;
  modelType?: string;
  selections?: Selection[];
}

export interface ChatTab {
  id: string;
  title: string;
  timestamp: string;
  bubbles: ChatBubble[];
}

export interface Workspace {
  id: string;
  path: string;
  folder?: string;
  lastModified: string;
  chatCount: number;
} 
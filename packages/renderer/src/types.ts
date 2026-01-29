export interface ThinkingContent {
  type: 'thinking'
  thinking: string
  signature?: string
}

export interface ToolUseContent {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, unknown>
}

export interface ToolResultTextPart {
  type: 'text'
  text: string
}

export interface ToolResultImagePart {
  type: 'image'
  source: {
    data: string
    media_type?: string
  }
}

export type ToolResultPart = ToolResultTextPart | ToolResultImagePart

export interface ToolResultContent {
  type: 'tool_result'
  tool_use_id: string
  content: string | ToolResultPart[]
}

export interface TextContent {
  type: 'text'
  text: string
}

export type MessageContent = ThinkingContent | ToolUseContent | ToolResultContent | TextContent

export interface Message {
  uuid: string
  parentUuid: string | null
  timestamp: string
  isSidechain: boolean
  role: 'user' | 'assistant'
  content: string | MessageContent[]
  model?: string
  stopReason?: string | null
  usage?: {
    inputTokens: number
    outputTokens: number
  }
}

export interface Session {
  sessionId: string
  firstPrompt: string
  summary: string
  messageCount: number
  created: string
  modified: string
  gitBranch: string
  isSidechain: boolean
  messages: Message[]
}

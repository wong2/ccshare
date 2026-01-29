import { User, Bot } from 'lucide-react'
import type { Message, MessageContent } from '../types'
import { ThinkingBlock } from './ThinkingBlock'
import { ToolUseBlock } from './ToolUseBlock'
import { MarkdownContent } from './MarkdownContent'

interface MessageBubbleProps {
  message: Message
  toolResultMap?: Map<string, string>
}

// System XML tags patterns
const SYSTEM_TAG_PATTERNS = [
  /^<local-command-caveat>/,
  /^<command-name>/,
  /^<local-command-stdout>/,
  /^<local-command-stderr>/,
  /^<system-reminder>/,
]

function isSystemMessage(text: string): boolean {
  const trimmed = text.trim()
  return SYSTEM_TAG_PATTERNS.some((pattern) => pattern.test(trimmed))
}

function SystemMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-center">
      <div className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 max-w-[80%]">
        <pre className="whitespace-pre-wrap font-mono">{content}</pre>
      </div>
    </div>
  )
}

export function MessageBubble({ message, toolResultMap }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const content = message.content

  // Check if entire message is a system message (string content)
  if (typeof content === 'string') {
    if (isSystemMessage(content)) {
      return <SystemMessage content={content} />
    }
  }

  // Check if message contains only system messages
  if (Array.isArray(content)) {
    const allSystem = content.every(
      (block) => block.type === 'text' && isSystemMessage(block.text)
    )
    if (allSystem) {
      return (
        <div className="space-y-2">
          {content.map((block, index) => (
            block.type === 'text' && <SystemMessage key={index} content={block.text} />
          ))}
        </div>
      )
    }
  }

  const renderContent = () => {
    if (typeof content === 'string') {
      return <MarkdownContent content={content} />
    }

    if (Array.isArray(content)) {
      return (
        <div className="space-y-3">
          {content.map((block, index) => {
            if (block.type === 'thinking') {
              return <ThinkingBlock key={index} thinking={block.thinking} />
            }
            if (block.type === 'tool_use') {
              const result = toolResultMap?.get(block.id)
              return (
                <ToolUseBlock
                  key={index}
                  name={block.name}
                  input={block.input}
                  result={result}
                />
              )
            }
            if (block.type === 'text') {
              if (isSystemMessage(block.text)) {
                return <SystemMessage key={index} content={block.text} />
              }
              return <MarkdownContent key={index} content={block.text} />
            }
            return null
          })}
        </div>
      )
    }

    return null
  }

  const hasVisibleContent = () => {
    if (typeof content === 'string') return content.trim().length > 0
    if (Array.isArray(content)) {
      return content.some((block: MessageContent) => {
        if (block.type === 'text') return block.text.trim().length > 0
        if (block.type === 'tool_result') return false
        return true
      })
    }
    return false
  }

  if (!hasVisibleContent()) return null

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-200">
        {isUser ? (
          <User size={18} className="text-gray-600" />
        ) : (
          <Bot size={18} className="text-gray-600" />
        )}
      </div>
      <div className="flex-1 max-w-[85%] rounded-2xl px-4 py-3 bg-gray-100 text-gray-900">
        {renderContent()}
      </div>
    </div>
  )
}

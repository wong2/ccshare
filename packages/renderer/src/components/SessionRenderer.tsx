import { useMemo } from 'react'
import type { Session, Message, ToolResultContent, ToolResultPart } from '../types'
import { SessionHeader } from './SessionHeader'
import { MessageBubble } from './MessageBubble'

interface SessionRendererProps {
  session: Session
}

function extractToolResultText(content: string | ToolResultPart[]): string {
  if (typeof content === 'string') {
    return content
  }
  // Handle array of parts - extract text parts and join them
  return content
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('\n')
}

export function SessionRenderer({ session }: SessionRendererProps) {
  // Build a map of tool_use_id -> tool_result content (as string)
  const toolResultMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const message of session.messages) {
      if (Array.isArray(message.content)) {
        for (const block of message.content) {
          if (block.type === 'tool_result') {
            const resultBlock = block as ToolResultContent
            map.set(resultBlock.tool_use_id, extractToolResultText(resultBlock.content))
          }
        }
      }
    }
    return map
  }, [session.messages])

  // Filter out messages that only contain tool_result
  const filteredMessages = useMemo(() => {
    return session.messages.filter((message: Message) => {
      if (Array.isArray(message.content)) {
        const hasOnlyToolResults = message.content.every(
          (block) => block.type === 'tool_result'
        )
        return !hasOnlyToolResults
      }
      return true
    })
  }, [session.messages])

  return (
    <div className="min-h-screen bg-white">
      <SessionHeader session={session} />
      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="space-y-6">
          {filteredMessages.map((message) => (
            <MessageBubble
              key={message.uuid}
              message={message}
              toolResultMap={toolResultMap}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

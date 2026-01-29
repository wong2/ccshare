import { GitBranch, Clock, MessageSquare } from 'lucide-react'
import type { Session } from '../types'

interface SessionHeaderProps {
  session: Session
}

export function SessionHeader({ session }: SessionHeaderProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString()
  }

  return (
    <div className="border-b border-gray-200 px-6 py-4">
      <h1 className="text-xl font-semibold text-black mb-2">{session.summary}</h1>
      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1.5">
          <GitBranch size={14} />
          <span>{session.gitBranch}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={14} />
          <span>{formatDate(session.created)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MessageSquare size={14} />
          <span>{session.messageCount} messages</span>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { SquareCode, ChevronDown, ChevronRight } from 'lucide-react'

interface ToolResultBlockProps {
  content: string
}

export function ToolResultBlock({ content }: ToolResultBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const lines = content.split('\n')
  const preview = lines.slice(0, 3).join('\n')
  const hasMore = lines.length > 3

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-gray-500 hover:bg-gray-100 transition-colors text-left"
      >
        {hasMore ? (
          isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
        ) : (
          <div className="w-4" />
        )}
        <SquareCode size={16} />
        <span className="text-sm font-medium">Result</span>
        {hasMore && !isExpanded && (
          <span className="text-xs text-gray-400">({lines.length} lines)</span>
        )}
      </button>
      <div className="px-4 py-3 border-t border-gray-200">
        <pre className="text-gray-700 text-xs overflow-x-auto whitespace-pre-wrap">
          {isExpanded || !hasMore ? content : preview + '\n...'}
        </pre>
      </div>
    </div>
  )
}

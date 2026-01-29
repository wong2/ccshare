import { useState } from 'react'
import { Brain, ChevronDown, ChevronRight } from 'lucide-react'

interface ThinkingBlockProps {
  thinking: string
}

export function ThinkingBlock({ thinking }: ThinkingBlockProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors text-left"
      >
        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <Brain size={16} />
        <span className="text-sm font-medium">Thinking</span>
      </button>
      {isExpanded && (
        <div className="px-4 py-3 border-t border-gray-200 text-gray-700 text-sm whitespace-pre-wrap">
          {thinking}
        </div>
      )}
    </div>
  )
}

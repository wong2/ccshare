import { useState } from 'react'
import { Wrench, ChevronDown, ChevronRight } from 'lucide-react'
import { ToolResultBlock } from './ToolResultBlock'

interface ToolUseBlockProps {
  name: string
  input: Record<string, unknown>
  result?: string
}

export function ToolUseBlock({ name, input, result }: ToolUseBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getToolSummary = () => {
    if (name === 'Read' && input.file_path) {
      return `Read: ${String(input.file_path).split('/').slice(-2).join('/')}`
    }
    if (name === 'Grep' && input.pattern) {
      return `Grep: ${input.pattern}`
    }
    if (name === 'Glob' && input.pattern) {
      return `Glob: ${input.pattern}`
    }
    if (name === 'Bash' && input.command) {
      const cmd = String(input.command)
      return `Bash: ${cmd.length > 50 ? cmd.slice(0, 50) + '...' : cmd}`
    }
    if (name === 'Edit' && input.file_path) {
      return `Edit: ${String(input.file_path).split('/').slice(-2).join('/')}`
    }
    if (name === 'Write' && input.file_path) {
      return `Write: ${String(input.file_path).split('/').slice(-2).join('/')}`
    }
    return name
  }

  return (
    <div className="space-y-2">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors text-left"
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Wrench size={16} />
          <span className="text-sm font-medium">{getToolSummary()}</span>
        </button>
        {isExpanded && (
          <div className="px-4 py-3 border-t border-gray-200">
            <pre className="text-gray-700 text-xs overflow-x-auto">
              {JSON.stringify(input, null, 2)}
            </pre>
          </div>
        )}
      </div>
      {result && <ToolResultBlock content={result} />}
    </div>
  )
}

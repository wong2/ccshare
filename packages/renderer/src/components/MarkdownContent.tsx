import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownContentProps {
  content: string
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const isInline = !className

            if (isInline) {
              return (
                <code className="bg-gray-200 px-1.5 py-0.5 rounded text-sm text-gray-800" {...props}>
                  {children}
                </code>
              )
            }

            return (
              <pre className="bg-gray-100 border border-gray-200 rounded-lg p-4 overflow-x-auto">
                <code className="text-sm text-gray-800" {...props}>
                  {children}
                </code>
              </pre>
            )
          },
          a({ children, href, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-900 underline hover:text-gray-600"
                {...props}
              >
                {children}
              </a>
            )
          },
          ul({ children }) {
            return <ul className="list-disc list-inside space-y-1">{children}</ul>
          },
          ol({ children }) {
            return <ol className="list-decimal list-inside space-y-1">{children}</ol>
          },
          li({ children }) {
            return <li className="text-inherit">{children}</li>
          },
          p({ children }) {
            return <p className="text-inherit leading-relaxed">{children}</p>
          },
          h1({ children }) {
            return <h1 className="text-xl font-bold text-inherit mt-4 mb-2">{children}</h1>
          },
          h2({ children }) {
            return <h2 className="text-lg font-bold text-inherit mt-4 mb-2">{children}</h2>
          },
          h3({ children }) {
            return <h3 className="text-base font-bold text-inherit mt-3 mb-2">{children}</h3>
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600">
                {children}
              </blockquote>
            )
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">{children}</table>
              </div>
            )
          },
          th({ children }) {
            return (
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider bg-gray-100">
                {children}
              </th>
            )
          },
          td({ children }) {
            return <td className="px-3 py-2 text-sm text-inherit border-t border-gray-200">{children}</td>
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

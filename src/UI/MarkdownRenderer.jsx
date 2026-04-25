import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const mdComponents = {
  p: ({ children }) => (
    <p className="mb-3 last:mb-0 leading-loose">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-extrabold">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="list-disc mr-5 mb-3 space-y-1.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal mr-5 mb-3 space-y-1.5">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-loose">{children}</li>
  ),
  h1: ({ children }) => (
    <h1 className="text-xl font-extrabold mb-3 mt-4">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-extrabold mb-2 mt-3">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-bold mb-2 mt-3">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-bold mb-1.5 mt-2">{children}</h4>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-r-4 border-blue-300 pr-4 my-3 italic opacity-90">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="bg-blue-100/60 text-blue-800 px-1.5 py-0.5 rounded text-xs font-mono">
          {children}
        </code>
      );
    }
    return (
      <code className="block bg-gray-100 rounded-lg p-3 my-2 text-xs font-mono overflow-x-auto text-right direction-ltr">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="bg-gray-100 rounded-lg p-3 my-3 overflow-x-auto text-right direction-ltr">
      {children}
    </pre>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-teal-600 hover:text-teal-800 underline underline-offset-2 transition"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-4 border-gray-200" />,
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table className="min-w-full border border-gray-200 rounded-lg text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-gray-50">{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-gray-100">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-right font-bold text-gray-700 border-l border-gray-200">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-right text-gray-600 border-l border-gray-200">
      {children}
    </td>
  ),
};

const mdComponentsCompact = {
  ...mdComponents,
  p: ({ children }) => (
    <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc mr-4 mb-1.5 space-y-0.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal mr-4 mb-1.5 space-y-0.5">{children}</ol>
  ),
  h1: ({ children }) => (
    <h1 className="text-sm font-extrabold mb-1.5 mt-2">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-sm font-extrabold mb-1.5 mt-2">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-extrabold mb-1.5 mt-2">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-bold mb-1 mt-1.5">{children}</h4>
  ),
};

export function MarkdownRenderer({ content, compact = false }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={compact ? mdComponentsCompact : mdComponents}
    >
      {content}
    </ReactMarkdown>
  );
}

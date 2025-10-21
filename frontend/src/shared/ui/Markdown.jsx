import React from 'react'

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function inlineFormat(s) {
  // code blocks (inline)
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>')
  // bold **text**
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  // italics *text*
  s = s.replace(/(^|[^*])\*(?!\*)([^*]+)\*(?!\*)/g, '$1<em>$2</em>')
  // links
  s = s.replace(/(https?:\/\/[^\s)]+)(?![^<]*>|[^<>]*<\/?)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
  return s
}

function markdownToHtml(md) {
  if (!md) return ''
  // code blocks ```
  const codeBlockRegex = /```([\s\S]*?)```/g
  let parts = []
  let lastIndex = 0
  let match
  while ((match = codeBlockRegex.exec(md)) !== null) {
    const before = md.slice(lastIndex, match.index)
    if (before) parts.push({ type: 'text', content: before })
    parts.push({ type: 'code', content: match[1] })
    lastIndex = match.index + match[0].length
  }
  const tail = md.slice(lastIndex)
  if (tail) parts.push({ type: 'text', content: tail })

  const html = parts
    .map((p) => {
      if (p.type === 'code') {
        return `<pre class="markdown-pre"><code>${escapeHtml(p.content)}</code></pre>`
      }
      // process lists and paragraphs line-by-line
      const lines = p.content.split(/\r?\n/)
      let out = ''
      let listType = null
      let buf = []
      const flushList = () => {
        if (!listType) return
        out += listType === 'ol' ? '<ol class="markdown-ol">' : '<ul class="markdown-ul">'
        out += buf.join('')
        out += listType === 'ol' ? '</ol>' : '</ul>'
        listType = null
        buf = []
      }
      for (const rawLine of lines) {
        const line = rawLine.trim()
        const ol = line.match(/^(\d+)\.\s+(.+)/)
        const ul = line.match(/^[-•]\s+(.+)/)
        if (ol) {
          if (listType && listType !== 'ol') flushList()
          listType = 'ol'
          buf.push(`<li>${inlineFormat(escapeHtml(ol[2]))}</li>')
          `.trim())
          continue
        }
        if (ul) {
          if (listType && listType !== 'ul') flushList()
          listType = 'ul'
          buf.push(`<li>${inlineFormat(escapeHtml(ul[1]))}</li>')
          `.trim())
          continue
        }
        // plain line
        if (listType) flushList()
        if (line.length === 0) {
          out += '<br />'
        } else {
          out += `<p class="markdown-p">${inlineFormat(escapeHtml(line))}</p>`
        }
      }
      if (listType) flushList()
      return out
    })
    .join('')
  return html
}

export default function Markdown({ text }) {
  const html = markdownToHtml(text)
  return <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
}



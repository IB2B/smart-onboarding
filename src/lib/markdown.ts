import { marked } from 'marked'
import DOMPurify from 'dompurify'

const renderer = new marked.Renderer()
marked.use({ breaks: true, gfm: true, async: false, renderer })

export function renderMarkdown(raw: string): string {
  const html = marked.parse(raw, { async: false }) as string
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'del',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'a', 'hr',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    FORCE_BODY: true,
  })
}

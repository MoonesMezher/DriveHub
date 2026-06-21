/** Renders YouTube embed or external video link */
export const VideoEmbed = ({ url, title = 'فيديو تعليمي', className = '' }) => {
  if (!url) return null

  const isEmbed = url.includes('youtube.com/embed') || url.includes('youtu.be')
  const embedUrl = url.includes('youtu.be')
    ? `https://www.youtube.com/embed/${url.split('/').pop()}`
    : url.includes('watch?v=')
      ? url.replace('watch?v=', 'embed/')
      : url

  if (isEmbed || url.includes('youtube')) {
    return (
      <div className={`aspect-video overflow-hidden rounded-xl bg-surface-container ${className}`}>
        <iframe
          src={embedUrl}
          title={title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 text-label-md text-on-primary-container underline ${className}`}
    >
      مشاهدة الفيديو
    </a>
  )
}

/** Simple markdown-ish body renderer (headings, bold, blockquote) */
export const RichTextBody = ({ content, className = '' }) => {
  if (!content) return null

  const lines = content.split('\n')

  return (
    <div className={`space-y-2 text-body-md leading-relaxed ${className}`}>
      {lines.map((line, i) => {
        const trimmed = line.trim()
        if (!trimmed) return <br key={i} />
        if (trimmed.startsWith('## ')) {
          return <h3 key={i} className="mt-4 text-headline-sm font-semibold">{trimmed.slice(3)}</h3>
        }
        if (trimmed.startsWith('### ')) {
          return <h4 key={i} className="mt-3 text-label-md font-semibold">{trimmed.slice(4)}</h4>
        }
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={i} className="border-s-4 border-secondary-container ps-4 italic opacity-90">
              {trimmed.slice(2)}
            </blockquote>
          )
        }
        const html = trimmed
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
        return <p key={i} dangerouslySetInnerHTML={{ __html: html }} />
      })}
    </div>
  )
}

const URL_REGEX = /(https?:\/\/[^\s<>"']+)/gi

/** Split plain text and render http(s) URLs as safe external links. */
export function linkifyText(text) {
  if (text == null || text === '') return null
  const parts = String(text).split(URL_REGEX)
  return parts.map((part, index) => {
    if (/^https?:\/\//i.test(part)) {
      return (
        <a
          key={`url-${index}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all text-primary underline underline-offset-2"
        >
          {part}
        </a>
      )
    }
    return <span key={`text-${index}`}>{part}</span>
  })
}

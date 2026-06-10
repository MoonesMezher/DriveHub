/**
 * Wraps AsyncContent JSX children in {() => (...)} when not already deferred.
 * Run: node scripts/wrap-async-content.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcRoot = path.join(__dirname, '..', 'src')

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (entry.name.endsWith('.jsx')) files.push(full)
  }
  return files
}

function findAsyncContentBlocks(content) {
  const blocks = []
  const tag = '<AsyncContent'
  let searchFrom = 0

  while (true) {
    const start = content.indexOf(tag, searchFrom)
    if (start === -1) break

    const openEnd = content.indexOf('>', start)
    if (openEnd === -1) break

    let depth = 1
    let pos = openEnd + 1
    let closeStart = -1

    while (pos < content.length && depth > 0) {
      const nextOpen = content.indexOf('<AsyncContent', pos)
      const nextClose = content.indexOf('</AsyncContent>', pos)
      if (nextClose === -1) break

      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth += 1
        pos = nextOpen + 1
      } else {
        depth -= 1
        if (depth === 0) closeStart = nextClose
        pos = nextClose + 1
      }
    }

    if (closeStart === -1) break

    const innerStart = openEnd + 1
    const inner = content.slice(innerStart, closeStart)
    blocks.push({ start: innerStart, end: closeStart, inner })
    searchFrom = closeStart + '</AsyncContent>'.length
  }

  return blocks
}

function needsWrap(inner) {
  const trimmed = inner.trimStart()
  if (!trimmed) return false
  if (trimmed.startsWith('{() =>')) return false
  if (trimmed.startsWith('{()=>')) return false
  if (trimmed.startsWith('{render =>')) return false
  // Already a JSX expression (conditional render, fragment, etc.)
  if (trimmed.startsWith('{')) return false
  return true
}

function wrapInner(inner) {
  const leading = inner.match(/^\s*/)?.[0] ?? ''
  const trailing = inner.match(/\s*$/)?.[0] ?? ''
  const core = inner.trim()
  return `${leading}{() => (\n${core}\n${leading})}${trailing}`
}

let changed = 0

for (const file of walk(srcRoot)) {
  if (file.endsWith('AsyncContent.jsx')) continue

  let content = fs.readFileSync(file, 'utf8')
  if (!content.includes('AsyncContent')) continue

  const blocks = findAsyncContentBlocks(content)
  if (!blocks.length) continue

  let offset = 0
  let fileChanged = false

  for (const block of blocks) {
    if (!needsWrap(block.inner)) continue
    const wrapped = wrapInner(block.inner)
    const absStart = block.start + offset
    const absEnd = block.end + offset
    content = content.slice(0, absStart) + wrapped + content.slice(absEnd)
    offset += wrapped.length - block.inner.length
    fileChanged = true
  }

  if (fileChanged) {
    fs.writeFileSync(file, content)
    changed += 1
    console.log('updated:', path.relative(srcRoot, file))
  }
}

console.log(`done — ${changed} file(s) updated`)

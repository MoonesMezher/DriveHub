import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src')

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else if (/\.(jsx?|tsx?)$/.test(entry.name)) acc.push(full)
  }
  return acc
}

function scanFile(file) {
  const src = fs.readFileSync(file, 'utf8')
  const issues = []
  const importRe = /^import\s+([^;]+);/gm
  let match

  while ((match = importRe.exec(src)) !== null) {
    const clause = match[1]
    if (!/\bfrom\b/.test(clause)) continue

    const [namesPart] = clause.split(/\s+from\s+/)
    const cleaned = namesPart.replace(/^import\s+/, '').trim()

    if (cleaned.startsWith('{')) {
      const names = cleaned
        .slice(1, -1)
        .split(',')
        .map((part) => part.trim().split(/\s+as\s+/).pop().trim())
        .filter(Boolean)

      for (const name of names) {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const re = new RegExp(`\\b${escaped}\\b`, 'g')
        const count = (src.match(re) || []).length
        if (count <= 1) {
          issues.push({ type: 'unused-import', name })
        }
      }
    }
  }

  return issues.map((issue) => ({ file: path.relative(root, file), ...issue }))
}

const SKIP = new Set(['test', 'main.jsx', 'App.jsx'])
const allIssues = []
for (const file of walk(root)) {
  const rel = path.relative(root, file)
  if (rel.includes(`${path.sep}test${path.sep}`)) continue
  if (SKIP.has(path.basename(file))) continue
  allIssues.push(...scanFile(file))
}

const byFile = {}
for (const issue of allIssues) {
  byFile[issue.file] ??= []
  byFile[issue.file].push(issue.name)
}

console.log(JSON.stringify(byFile, null, 2))
console.log(`\nTotal suspicious imports: ${allIssues.length}`)

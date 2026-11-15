// Runs after `next build`. Turns the ~2,200 /will-it-run pages into plain static HTML.
//
// Next writes each page's content three times: the HTML, a JSON copy inlined in that HTML
// so React can take over in the browser (about 2.5x the size of the HTML itself), and an
// index.txt for no-reload navigation. These pages need none of that: they are text and
// tables, and their one interactive bit (the list filter) is a small inline script marked
// data-keep. So: drop every other script, the script preloads, and the index.txt files.
// Everything that links to these pages uses a plain <a>, so nothing asks for the removed files.
import { readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'out/will-it-run'
const KEEP = /^<script\b[^>]*(type="application\/ld\+json"|data-keep)/
let pages = 0
let before = 0
let after = 0

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) walk(p)
    else if (entry.name === 'index.txt') {
      before += statSync(p).size
      rmSync(p)
    } else if (entry.name === 'index.html') {
      const html = readFileSync(p, 'utf8')
      const slim = html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, (m) => (KEEP.test(m) ? m : ''))
        .replace(/<link rel="preload" as="script"[^>]*>/g, '')
      if (!slim.includes('data-keep') || !slim.includes('<h1')) throw new Error(`prune-export: ${p} lost its content`)
      writeFileSync(p, slim)
      pages++
      before += html.length
      after += slim.length
    }
  }
}
walk(ROOT)
const mb = (n) => Math.round(n / 1e6)
console.log(`prune-export: ${pages} pages, ${mb(before)} MB -> ${mb(after)} MB`)

import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.join(__dirname, 'dist')
const host = process.env.HOST || '127.0.0.1'
const port = Number(process.env.PORT || 3000)

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.ico', 'image/x-icon'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.txt', 'text/plain; charset=utf-8'],
])

function contentTypeFor(filePath) {
  return contentTypes.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream'
}

async function resolveFilePath(requestPath) {
  const safePath = decodeURIComponent(requestPath.split('?')[0] || '/')
  const relativePath = safePath === '/' ? '/index.html' : safePath
  const directPath = path.join(distDir, relativePath)

  try {
    const fileStat = await stat(directPath)
    if (fileStat.isDirectory()) {
      return path.join(directPath, 'index.html')
    }
    return directPath
  } catch {
    if (!path.extname(relativePath)) {
      return path.join(distDir, 'index.html')
    }
    return directPath
  }
}

// Canonical URL hygiene (t147): page URLs (extensionless paths) must resolve to
// exactly one URL. 301 trailing-slash variants to the non-trailing form (the
// site-wide convention used by sitemap.xml and every canonical tag), and strip
// the legacy ?v= cache-buster from page URLs so crawlers consolidate signals.
// Static assets (paths with an extension) are never redirected.
function canonicalRedirect(rawUrl) {
  const [pathname, query = ''] = rawUrl.split('?')
  if (path.extname(pathname)) return null // asset — leave untouched
  let targetPath = pathname
  if (targetPath.length > 1 && targetPath.endsWith('/')) {
    targetPath = targetPath.replace(/\/+$/, '') || '/'
  }
  const params = new URLSearchParams(query)
  if (params.has('v')) params.delete('v')
  const targetQuery = params.toString()
  const target = targetPath + (targetQuery ? `?${targetQuery}` : '')
  const originalWithoutV = pathname + (query ? `?${query}` : '')
  return target !== originalWithoutV ? target : null
}

const server = createServer(async (req, res) => {
  try {
    if (!req.url) {
      res.statusCode = 400
      res.end('Bad request')
      return
    }

    const redirectTo = canonicalRedirect(req.url)
    if (redirectTo) {
      res.statusCode = 301
      res.setHeader('Location', redirectTo)
      res.setHeader('Cache-Control', 'no-cache')
      res.end()
      return
    }

    const filePath = await resolveFilePath(req.url)
    const fileData = await readFile(filePath)
    const isHtml = path.extname(filePath).toLowerCase() === '.html'

    res.statusCode = 200
    res.setHeader('Content-Type', contentTypeFor(filePath))
    res.setHeader('Cache-Control', isHtml ? 'no-cache' : 'public, max-age=31536000, immutable')
    res.end(fileData)
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      res.statusCode = 404
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end('Not found')
      return
    }

    console.error('Static server error:', error)
    res.statusCode = 500
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('Internal server error')
  }
})

server.listen(port, host, () => {
  console.log(`Webtoapp frontend serving ${distDir} on http://${host}:${port}`)
})

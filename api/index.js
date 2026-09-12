import startServer from '../dist/server/server.js'

export default async function handler(req, res) {
  const protocol = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers.host || 'localhost'
  const url = new URL(req.url || '/', `${protocol}://${host}`)

  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined) {
      headers.set(key, Array.isArray(value) ? value.join(', ') : value)
    }
  }

  const init = { method: req.method, headers }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = req
    init.duplex = 'half'
  }

  const response = await startServer.fetch(new Request(url, init))
  res.statusCode = response.status
  response.headers.forEach((value, key) => res.setHeader(key, value))
  res.end(Buffer.from(await response.arrayBuffer()))
}

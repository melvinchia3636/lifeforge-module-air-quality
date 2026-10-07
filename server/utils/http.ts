import https from 'node:https'

interface HttpsJsonOptions {
  method?: string
  headers?: Record<string, string>
  body?: string
  timeout?: number
}

export function httpsJson<T>(
  url: string,
  {
    method = 'GET',
    headers = {},
    body,
    timeout = 5000
  }: HttpsJsonOptions = {}
): Promise<T> {
  return new Promise((resolve, reject) => {
    const { hostname, port, pathname, search } = new URL(url)

    const req = https.request(
      {
        host: hostname,
        path: `${pathname}${search}`,
        port: port || 443,
        method,
        family: 4,
        headers: {
          ...headers,
          ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {})
        }
      },
      res => {
        let data = ''

        res.setEncoding('utf8')
        res.on('data', chunk => (data += chunk))
        res.on('end', () => {
          try {
            resolve(JSON.parse(data) as T)
          } catch {
            reject(new Error('Failed to parse response as JSON'))
          }
        })
      }
    )

    req.on('error', reject)
    req.setTimeout(timeout, () => {
      req.destroy(new Error('Request timed out'))
    })

    if (body) {
      req.write(body)
    }

    req.end()
  })
}

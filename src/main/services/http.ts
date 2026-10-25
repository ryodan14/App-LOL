import https from 'node:https'
import { URL } from 'node:url'

interface JsonOptions {
  timeoutMs?: number
  auth?: string
  rejectUnauthorized?: boolean
  redirects?: number
}

export function fetchJson<T>(url: string, options: JsonOptions = {}): Promise<T> {
  const {
    timeoutMs = 20_000,
    auth,
    rejectUnauthorized = true,
    redirects = 3
  } = options

  return new Promise<T>((resolve, reject) => {
    let settled = false
    const parsed = new URL(url)
    const request = https.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port,
        path: `${parsed.pathname}${parsed.search}`,
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'App-LOL/0.1 (+https://github.com/ryodan14/App-LOL)',
          ...(auth ? { Authorization: `Basic ${Buffer.from(auth).toString('base64')}` } : {})
        },
        rejectUnauthorized,
        timeout: timeoutMs
      },
      (response) => {
        const status = response.statusCode ?? 0
        if (status >= 300 && status < 400 && response.headers.location) {
          response.resume()
          if (redirects <= 0) {
            settled = true
            reject(new Error(`Demasiadas redirecciones para ${url}`))
            return
          }
          const next = new URL(response.headers.location, url).toString()
          fetchJson<T>(next, { ...options, redirects: redirects - 1 }).then(resolve, reject)
          return
        }

        if (status < 200 || status >= 300) {
          response.resume()
          settled = true
          reject(new Error(`HTTP ${status} al solicitar ${parsed.hostname}${parsed.pathname}`))
          return
        }

        const chunks: Buffer[] = []
        response.on('data', (chunk: Buffer) => chunks.push(chunk))
        response.on('end', () => {
          if (settled) return
          settled = true
          try {
            const text = Buffer.concat(chunks).toString('utf8')
            resolve(JSON.parse(text) as T)
          } catch (error) {
            reject(new Error(`Respuesta inválida de ${parsed.hostname}: ${(error as Error).message}`))
          }
        })
        response.on('error', (error) => {
          if (settled) return
          settled = true
          reject(error)
        })
      }
    )

    request.on('timeout', () => {
      request.destroy(new Error(`Tiempo de espera agotado al solicitar ${parsed.hostname}`))
    })
    request.on('error', (error) => {
      if (settled) return
      settled = true
      reject(error)
    })
    request.end()
  })
}

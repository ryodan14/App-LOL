import https from 'node:https'
import { URL } from 'node:url'
import type { Transform } from 'node:stream'
import { createBrotliDecompress, createGunzip, createInflate } from 'node:zlib'
import { isRetryableStatus, retryDelayMs } from './retry'

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

interface JsonOptions {
  timeoutMs?: number
  auth?: string
  rejectUnauthorized?: boolean
  redirects?: number
  retries?: number
  method?: string
  body?: unknown
}

function decompressor(encoding: string): Transform | null {
  if (encoding === 'gzip' || encoding === 'x-gzip') return createGunzip()
  if (encoding === 'deflate') return createInflate()
  if (encoding === 'br') return createBrotliDecompress()
  return null
}

export async function fetchJson<T>(url: string, options: JsonOptions = {}): Promise<T> {
  const { retries = 2, ...requestOptions } = options
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await requestJson<T>(url, requestOptions)
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 0
      const retryable = error instanceof HttpError ? isRetryableStatus(status) : true
      if (attempt >= retries || !retryable) throw error
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs(attempt)))
    }
  }
}

function requestJson<T>(url: string, options: JsonOptions = {}): Promise<T> {
  const {
    timeoutMs = 20_000,
    auth,
    rejectUnauthorized = true,
    redirects = 3,
    method = 'GET',
    body
  } = options
  const payload = body === undefined ? undefined : JSON.stringify(body)

  return new Promise<T>((resolve, reject) => {
    let settled = false
    const parsed = new URL(url)
    const request = https.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port,
        path: `${parsed.pathname}${parsed.search}`,
        method,
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate, br',
          'User-Agent': 'App-LOL (+https://github.com/ryodan14/App-LOL)',
          ...(payload
            ? {
                'Content-Type': 'application/json',
                'Content-Length': String(Buffer.byteLength(payload))
              }
            : {}),
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
          requestJson<T>(next, { ...options, redirects: redirects - 1 }).then(resolve, reject)
          return
        }

        if (status < 200 || status >= 300) {
          response.resume()
          settled = true
          reject(
            new HttpError(
              status,
              `HTTP ${status} al solicitar ${parsed.hostname}${parsed.pathname}`
            )
          )
          return
        }

        const chunks: Buffer[] = []
        const decoder = decompressor(String(response.headers['content-encoding'] ?? '').toLowerCase())
        const stream = decoder ? response.pipe(decoder) : response
        stream.on('data', (chunk: Buffer) => chunks.push(chunk))
        stream.on('error', (error) => {
          if (settled) return
          settled = true
          reject(error)
        })
        stream.on('end', () => {
          if (settled) return
          settled = true
          try {
            const text = Buffer.concat(chunks).toString('utf8').trim()
            resolve((text ? JSON.parse(text) : undefined) as T)
          } catch (error) {
            reject(new Error(`Respuesta inválida de ${parsed.hostname}: ${(error as Error).message}`))
          }
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
    request.end(payload)
  })
}

import net from 'node:net'
import tls from 'node:tls'

/**
 * A tiny Redis client over TCP (RESP2), enough for GET and SET. No dependency.
 * Each call opens a connection, sends AUTH and the commands together, reads the replies and closes,
 * which suits serverless where long-lived connections do not survive.
 */

export interface RedisTarget {
  host: string
  port: number
  username?: string
  password?: string
  tls: boolean
}

export type RespValue = string | number | null | Error

export function parseRedisUrl(raw: string): RedisTarget | null {
  try {
    const url = new URL(raw)
    if (url.protocol !== 'redis:' && url.protocol !== 'rediss:') return null
    return {
      host: url.hostname,
      port: Number(url.port || 6379),
      username: url.username ? decodeURIComponent(url.username) : undefined,
      password: url.password ? decodeURIComponent(url.password) : undefined,
      tls: url.protocol === 'rediss:'
    }
  } catch {
    return null
  }
}

export function encodeCommand(args: Array<string | number>): Buffer {
  const parts: Buffer[] = [Buffer.from(`*${args.length}\r\n`)]
  for (const arg of args) {
    const value = Buffer.from(String(arg))
    parts.push(Buffer.from(`$${value.length}\r\n`), value, Buffer.from('\r\n'))
  }
  return Buffer.concat(parts)
}

/** Reads as many complete replies as the buffer holds. `done` is false when a reply is still arriving. */
export function parseReplies(buffer: Buffer): { values: RespValue[], done: boolean } {
  const values: RespValue[] = []
  let offset = 0
  while (offset < buffer.length) {
    const lineEnd = buffer.indexOf('\r\n', offset)
    if (lineEnd === -1) return { values, done: false }
    const type = String.fromCharCode(buffer[offset]!)
    const line = buffer.toString('utf8', offset + 1, lineEnd)
    if (type === '+') {
      values.push(line)
      offset = lineEnd + 2
    } else if (type === '-') {
      values.push(new Error(line))
      offset = lineEnd + 2
    } else if (type === ':') {
      values.push(Number(line))
      offset = lineEnd + 2
    } else if (type === '$') {
      const length = Number(line)
      if (length === -1) {
        values.push(null)
        offset = lineEnd + 2
      } else {
        const end = lineEnd + 2 + length
        if (buffer.length < end + 2) return { values, done: false }
        values.push(buffer.toString('utf8', lineEnd + 2, end))
        offset = end + 2
      }
    } else {
      values.push(new Error('unexpected reply'))
      offset = lineEnd + 2
    }
  }
  return { values, done: true }
}

/** Sends the commands (after AUTH when a password is set) and resolves with one reply per command. */
export function runCommands(target: RedisTarget, commands: Array<Array<string | number>>, timeoutMs = 3000): Promise<RespValue[]> {
  return new Promise((resolve, reject) => {
    const auth = target.password ? [['AUTH', ...(target.username ? [target.username] : []), target.password]] : []
    const all = [...auth, ...commands]
    const wanted = all.length
    const socket = target.tls
      ? tls.connect({ host: target.host, port: target.port, servername: target.host })
      : net.connect({ host: target.host, port: target.port })
    let received = Buffer.alloc(0)
    let settled = false

    const finish = (error: Error | null, values?: RespValue[]) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      socket.destroy()
      if (error) reject(error)
      else resolve(values ?? [])
    }

    const timer = setTimeout(() => finish(new Error('redis timeout')), timeoutMs)
    socket.on('error', err => finish(err))
    socket.on('close', () => finish(new Error('redis connection closed')))
    socket.on(target.tls ? 'secureConnect' : 'connect', () => {
      socket.write(Buffer.concat(all.map(encodeCommand)))
    })
    socket.on('data', (chunk) => {
      received = Buffer.concat([received, chunk])
      const { values } = parseReplies(received)
      if (values.length < wanted) return
      const failed = values.slice(0, wanted).find(v => v instanceof Error)
      if (failed instanceof Error) return finish(failed)
      finish(null, values.slice(auth.length, wanted))
    })
  })
}

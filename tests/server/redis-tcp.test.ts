import net from 'node:net'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it } from 'vitest'
import { createRedisStore, demoStoreFromEnv, type DemoState } from '../../server/utils/demoStore'
import { encodeCommand, parseRedisUrl, parseReplies, runCommands } from '../../server/utils/redisTcp'

/** A tiny in-process Redis: AUTH, GET, SET. Lets us test the real socket code. */
function startFakeRedis(password?: string) {
  const data = new Map<string, string>()
  const commandsSeen: string[][] = []
  const server = net.createServer((socket) => {
    let buffer = Buffer.alloc(0)
    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk])
      for (;;) {
        const args = readCommand(buffer)
        if (!args) return
        buffer = buffer.subarray(args.used)
        commandsSeen.push(args.parts)
        const [name, ...rest] = args.parts
        if (name === 'AUTH') socket.write(rest.at(-1) === password ? '+OK\r\n' : '-WRONGPASS invalid password\r\n')
        else if (name === 'SET') {
          data.set(rest[0]!, rest[1]!)
          socket.write('+OK\r\n')
        } else if (name === 'GET') {
          const value = data.get(rest[0]!)
          socket.write(value === undefined ? '$-1\r\n' : `$${Buffer.byteLength(value)}\r\n${value}\r\n`)
        } else socket.write('-ERR unknown command\r\n')
      }
    })
  })
  return new Promise<{ port: number, data: Map<string, string>, commandsSeen: string[][], close: () => void }>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({ port: (server.address() as AddressInfo).port, data, commandsSeen, close: () => server.close() })
    })
  })
}

function readCommand(buffer: Buffer): { parts: string[], used: number } | null {
  if (buffer.length === 0 || buffer[0] !== 0x2a) return null
  let offset = 0
  const eol = () => buffer.indexOf('\r\n', offset)
  let end = eol()
  if (end === -1) return null
  const count = Number(buffer.toString('utf8', 1, end))
  offset = end + 2
  const parts: string[] = []
  for (let i = 0; i < count; i++) {
    end = eol()
    if (end === -1) return null
    const length = Number(buffer.toString('utf8', offset + 1, end))
    const start = end + 2
    if (buffer.length < start + length + 2) return null
    parts.push(buffer.toString('utf8', start, start + length))
    offset = start + length + 2
  }
  return { parts, used: offset }
}

describe('redis protocol helpers', () => {
  it('encodes a command as a RESP array of bulk strings', () => {
    expect(encodeCommand(['SET', 'a', 'héllo']).toString()).toBe('*3\r\n$3\r\nSET\r\n$1\r\na\r\n$6\r\nhéllo\r\n')
  })

  it('parses simple, error, integer and bulk replies, and waits for partial ones', () => {
    const { values, done } = parseReplies(Buffer.from('+OK\r\n-ERR nope\r\n:7\r\n$5\r\nhello\r\n$-1\r\n'))
    expect(done).toBe(true)
    expect(values[0]).toBe('OK')
    expect(values[1]).toBeInstanceOf(Error)
    expect(values.slice(2)).toEqual([7, 'hello', null])
    expect(parseReplies(Buffer.from('$10\r\nhel')).values).toEqual([])
  })

  it('reads host, port and credentials from a redis URL and rejects other URLs', () => {
    expect(parseRedisUrl('redis://default:p%40ss@example.com:47370')).toEqual({ host: 'example.com', port: 47370, username: 'default', password: 'p@ss', tls: false })
    expect(parseRedisUrl('rediss://h:1')?.tls).toBe(true)
    expect(parseRedisUrl('https://example.com')).toBeNull()
    expect(parseRedisUrl('not a url')).toBeNull()
  })
})

describe('redis over a real socket', () => {
  const servers: Array<() => void> = []
  afterEach(() => {
    servers.splice(0).forEach(close => close())
  })

  it('authenticates, then runs SET and GET', async () => {
    const fake = await startFakeRedis('s3cret')
    servers.push(fake.close)
    const target = { host: '127.0.0.1', port: fake.port, username: 'default', password: 's3cret', tls: false }
    expect(await runCommands(target, [['SET', 'k', 'v']])).toEqual(['OK'])
    expect(await runCommands(target, [['GET', 'k']])).toEqual(['v'])
    expect(fake.commandsSeen[0]).toEqual(['AUTH', 'default', 's3cret'])
  })

  it('rejects a wrong password and a closed port', async () => {
    const fake = await startFakeRedis('right')
    servers.push(fake.close)
    await expect(runCommands({ host: '127.0.0.1', port: fake.port, password: 'wrong', tls: false }, [['GET', 'k']])).rejects.toThrow(/WRONGPASS/)
    await expect(runCommands({ host: '127.0.0.1', port: 1, tls: false }, [['GET', 'k']], 500)).rejects.toThrow()
  })

  it('stores demo state through a redis URL and shares it between two stores', async () => {
    const fake = await startFakeRedis('pw')
    servers.push(fake.close)
    const url = `redis://default:pw@127.0.0.1:${fake.port}`
    const a = createRedisStore(url)!
    const b = createRedisStore(url)!
    const state: DemoState = { tickets: [], nextKey: 52, nextComment: 4 }
    expect(await a.load()).toBeNull()
    await a.save(state)
    expect(await b.load()).toEqual(state)
    expect([...fake.data.keys()][0]).toBe('ticketflow:demo:v1')
  })

  it('falls back quietly when Redis is unreachable', async () => {
    const store = createRedisStore('redis://default:pw@127.0.0.1:1')!
    expect(await store.load()).toBeNull()
    await expect(store.save({ tickets: [], nextKey: 50, nextComment: 1 })).resolves.toBeUndefined()
  })
})

describe('demoStoreFromEnv with REDIS_URL', () => {
  it('prefers REDIS_URL, ignores a bad one, and still supports Upstash', () => {
    expect(demoStoreFromEnv({ REDIS_URL: 'redis://default:pw@host:6379' })).toBeDefined()
    expect(demoStoreFromEnv({ REDIS_URL: 'garbage' })).toBeUndefined()
    expect(demoStoreFromEnv({ REDIS_URL: 'garbage', KV_REST_API_URL: 'https://x', KV_REST_API_TOKEN: 't' })).toBeDefined()
  })
})

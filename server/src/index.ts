import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import websocket from '@fastify/websocket'
import multipart from '@fastify/multipart'
import { networkInterfaces } from 'os'
import fs from 'fs'
import path from 'path'
import { createPairingSession, verifyCode } from './pairing/manager.js'
import { startPairingCleanup } from './pairing/cleanup.js'
import { addDevice, getDevices, removeDevice, bindSession, unbindSession } from './devices/manager.js'
import { checkRateLimit, resetRateLimit } from './security/rateLimit.js'
import { isAllowedFile } from './files/types.js'
import { getSafeFilename, getUploadPath } from './files/manager.js'
import { z } from 'zod'

startPairingCleanup()

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  }
})

const verifySchema = z.object({
  code: z.string().regex(/^\d{6,8}$/)
})

async function start() {
  try {
    await fastify.register(helmet)
    await fastify.register(cors, {
      origin: (origin, cb) => {
        if (!origin) return cb(null, true)
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
          return cb(null, true)
        }
        if (origin.includes('192.168.') || origin.includes('10.') || origin.includes('172.')) {
          return cb(null, true)
        }
        cb(new Error('Not allowed'), false)
      },
      credentials: true
    })
    await fastify.register(websocket)
    await fastify.register(multipart, {
      limits: {
        files: 20
      }
    })

    fastify.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() }
    })

    fastify.get('/info', async () => {
      const nets = networkInterfaces()
      const addresses: string[] = []
      for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
          if (net.family === 'IPv4' && !net.internal) {
            addresses.push(net.address)
          }
        }
      }
      return { addresses, port: Number(process.env.PORT) || 8080 }
    })

    fastify.post('/pair/create', async () => {
      const session = createPairingSession(120000)
      return { sessionId: session.id, expiresAt: session.expiresAt }
    })

    fastify.post('/pair/verify', async (request, reply) => {
      const parse = verifySchema.safeParse(request.body)
      if (!parse.success) {
        return reply.code(400).send({ ok: false, reason: 'invalid_format' })
      }
      const ip = request.ip || 'unknown'
      const rl = checkRateLimit(`pair:${ip}`, 5, 60000, 120000)
      if (!rl.allowed) {
        return reply.code(429).send({ ok: false, reason: 'rate_limited', retryAfter: rl.retryAfter })
      }
      const res = verifyCode(parse.data.code)
      if (!res.ok) {
        return reply.code(401).send(res)
      }
      resetRateLimit(`pair:${ip}`)
      const device = addDevice(`Phone-${Date.now().toString().slice(-4)}`, 'phone')
      return { ok: true, sessionId: res.sessionId, deviceId: device.id, device }
    })

    fastify.get('/devices', async () => {
      return { devices: getDevices() }
    })

    fastify.delete('/devices/:id', async (request, reply) => {
      const params = request.params as { id: string }
      const ok = removeDevice(params.id)
      return { ok }
    })

    fastify.post('/files/upload', async (request, reply) => {
      const ip = request.ip || 'unknown'
      const rl = checkRateLimit(`upload:${ip}`, 10, 60000, 60000)
      if (!rl.allowed) {
        return reply.code(429).send({ error: 'rate_limited', retryAfter: rl.retryAfter })
      }
      const parts = request.parts()
      const uploaded: any[] = []
      for await (const part of parts) {
        if (part.type === 'file') {
          const filename = part.filename
          const check = isAllowedFile(filename)
          if (!check.allowed) {
            return reply.code(400).send({ error: 'file_not_allowed', reason: check.reason, filename })
          }
          const safeName = getSafeFilename(filename)
          const savePath = getUploadPath(safeName)
          const writeStream = fs.createWriteStream(savePath)
          part.file.pipe(writeStream)
          await new Promise<void>((resolve, reject) => {
            writeStream.on('finish', () => resolve())
            writeStream.on('error', reject)
          })
          uploaded.push({ originalName: filename, savedName: safeName, size: (part.file as any).bytesRead })
        }
      }
      return { ok: true, uploaded }
    })

    fastify.get('/files/list', async () => {
      const dir = path.resolve(process.cwd(), 'uploads')
      if (!fs.existsSync(dir)) return { files: [] }
      const files = fs.readdirSync(dir).map(f => {
        const stat = fs.statSync(path.join(dir, f))
        return { name: f, size: stat.size, mtime: stat.mtime }
      })
      return { files }
    })

    fastify.get('/files/download/:name', async (request, reply) => {
      const params = request.params as { name: string }
      if (params.name.includes('..') || params.name.includes('/') || params.name.includes('\\')) {
        return reply.code(400).send({ error: 'invalid_name' })
      }
      const filePath = getUploadPath(params.name)
      if (!fs.existsSync(filePath)) {
        return reply.code(404).send({ error: 'not_found' })
      }
      return reply.send(fs.createReadStream(filePath))
    })

    fastify.get('/ws', { websocket: true }, (socket: any, req: any) => {
      const origin = req.headers.origin
      if (origin) {
        const allowed = origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.') || origin.includes('10.') || origin.includes('172.')
        if (!allowed) {
          socket.close()
          return
        }
      }
      socket.on('message', (message: any) => {
        try {
          const data = JSON.parse(message.toString())
          if (data.type === 'pair:hello') {
            socket.send(JSON.stringify({ type: 'pair:ack', ok: true }))
            return
          }
          if (data.type === 'device:register') {
            const dev = addDevice(data.name || 'Device', data.deviceType || 'phone')
            bindSession(socket.id || 'ws', dev.id)
            socket.send(JSON.stringify({ type: 'device:registered', device: dev }))
            if (fastify.websocketServer && fastify.websocketServer.clients) {
              fastify.websocketServer.clients.forEach((client: any) => {
                if (client.readyState === 1) {
                  client.send(JSON.stringify({ type: 'devices:update', devices: getDevices() }))
                }
              })
            }
            return
          }
          socket.send(JSON.stringify({ type: 'echo', data }))
        } catch (e) {
          socket.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }))
        }
      })
      socket.on('close', () => {
        unbindSession(socket.id || 'ws')
      })
      socket.send(JSON.stringify({ type: 'welcome', message: 'LinkDesk Local WebSocket' }))
    })

    const port = Number(process.env.PORT) || 8080
    const host = '0.0.0.0'
    await fastify.listen({ port, host })
    fastify.log.info(`Server running at http://${host}:${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()

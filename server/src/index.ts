import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import websocket from '@fastify/websocket'
import multipart from '@fastify/multipart'
import { networkInterfaces } from 'os'
import fs from 'fs'
import { z } from 'zod'

import { createPairingSession, verifyCode } from './pairing/manager.js'
import { startPairingCleanup } from './pairing/cleanup.js'
import { createQRPairSession, getQRPairSession } from './pairing/qr.js'
import { addDevice, getDevices, removeDevice, bindSession, unbindSession } from './devices/manager.js'
import { checkRateLimit, resetRateLimit } from './security/rateLimit.js'
import { isAllowedFile } from './files/types.js'
import { getSafeFilename, getUploadPath, recordFile, getFiles, deleteFile, getFileBySavedName } from './files/manager.js'
import { getLocalUrls } from './network/qr.js'
import { addTextMessage, getTextMessages } from './text/manager.js'
import { setClipboard, getClipboard } from './clipboard/manager.js'
import { validateDeviceToken } from './security/auth.js'

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
  code: z.string().regex(/^\d{6,8}$/),
  sessionId: z.string().optional(),
  deviceName: z.string().optional(),
  deviceType: z.enum(['pc', 'phone']).optional()
})

const textMessageSchema = z.object({
  text: z.string().min(1).max(50000),
  from: z.string().optional(),
  fromType: z.enum(['pc', 'phone']).optional(),
  senderDeviceId: z.string().optional(),
  targetDeviceIds: z.array(z.string()).optional()
})

const clipboardSchema = z.object({
  text: z.string().max(500000),
  from: z.string().optional(),
  fromType: z.enum(['pc', 'phone']).optional(),
  senderDeviceId: z.string().optional(),
  targetDeviceIds: z.array(z.string()).optional()
})

// Targeted and broadcast WS dispatcher
function sendWsMessage(type: string, payload: any, targetDeviceIds?: string[], senderSocket?: any) {
  if (!fastify.websocketServer || !fastify.websocketServer.clients) return
  const data = JSON.stringify({ ...payload, type })
  fastify.websocketServer.clients.forEach((client: any) => {
    if (client.readyState === 1 && client !== senderSocket) {
      if (!targetDeviceIds || targetDeviceIds.length === 0) {
        // Broadcast to all
        client.send(data)
      } else {
        // Targeted to specific devices
        if (client.deviceId && targetDeviceIds.includes(client.deviceId)) {
          client.send(data)
        }
      }
    }
  })
}

function broadcastWS(type: string, payload: any, senderSocket?: any) {
  sendWsMessage(type, payload, undefined, senderSocket)
}

async function start() {
  try {
    await fastify.register(helmet, {
      contentSecurityPolicy: false // Allows local scripts/media in dev
    })

    await fastify.register(cors, {
      origin: (origin, cb) => {
        if (!origin) return cb(null, true)
        if (
          origin.includes('localhost') ||
          origin.includes('127.0.0.1') ||
          origin.includes('192.168.') ||
          origin.includes('10.') ||
          origin.includes('172.')
        ) {
          return cb(null, true)
        }
        cb(new Error('Not allowed'), false)
      },
      credentials: true
    })

    await fastify.register(websocket)

    await fastify.register(multipart, {
      limits: {
        fileSize: 10 * 1024 * 1024 * 1024, // 10 GB
        files: 20
      }
    })

    // Health
    fastify.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() }
    })

    // Info & IP addresses
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
      const port = Number(process.env.PORT) || 8080
      return { addresses, port }
    })

    // Connect URLs for QR codes
    fastify.get('/connect', async () => {
      const clientPort = 5173
      const urls = getLocalUrls(clientPort)
      return {
        urls,
        primaryUrl: urls[0] || `http://localhost:${clientPort}`,
        clientPort,
        serverPort: Number(process.env.PORT) || 8080
      }
    })

    // Pairing Routes
    fastify.post('/pair/create', async () => {
      const session = createPairingSession(120000)
      return { sessionId: session.id, code: session.code, expiresAt: session.expiresAt }
    })

    fastify.post('/pair/qr/create', async () => {
      const session = createQRPairSession(120000)
      const clientPort = 5173
      const urls = getLocalUrls(clientPort)
      const base = urls[0] || `http://localhost:${clientPort}`
      const qrUrl = `${base}/pair/qr?sid=${session.id}&code=${session.code}`
      return {
        sessionId: session.id,
        code: session.code,
        expiresAt: session.expiresAt,
        qrUrl
      }
    })

    fastify.get('/pair/qr/:id', async (request, reply) => {
      const params = request.params as { id: string }
      const session = getQRPairSession(params.id)
      if (!session) {
        return reply.code(404).send({ error: 'not_found' })
      }
      if (session.expiresAt < Date.now()) {
        return reply.code(410).send({ error: 'expired' })
      }
      return { sessionId: session.id, code: session.code, expiresAt: session.expiresAt }
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

      const res = verifyCode(parse.data.code, parse.data.sessionId)
      if (!res.ok) {
        return reply.code(401).send(res)
      }

      resetRateLimit(`pair:${ip}`)
      const deviceName = parse.data.deviceName || `Phone-${Date.now().toString().slice(-4)}`
      const deviceType = parse.data.deviceType || 'phone'
      const device = addDevice(deviceName, deviceType)

      // Broadcast device update via WS
      broadcastWS('devices:update', { devices: getDevices() })

      return { ok: true, sessionId: res.sessionId, deviceId: device.id, device }
    })

    // Devices Routes
    fastify.get('/devices', async () => {
      return { devices: getDevices() }
    })

    fastify.delete('/devices/:id', async (request) => {
      const params = request.params as { id: string }
      const ok = removeDevice(params.id)
      broadcastWS('devices:update', { devices: getDevices() })
      return { ok }
    })

    // Files Routes
    fastify.post('/files/upload', async (request, reply) => {
      const ip = request.ip || 'unknown'
      const rl = checkRateLimit(`upload:${ip}`, 30, 60000, 60000)
      if (!rl.allowed) {
        return reply.code(429).send({ error: 'rate_limited', retryAfter: rl.retryAfter })
      }

      const parts = request.parts()
      const uploaded: any[] = []
      let senderDeviceId: string | undefined
      let senderName: string | undefined
      let targetDeviceIds: string[] | undefined

      for await (const part of parts) {
        if (part.type === 'field') {
          if (part.fieldname === 'senderDeviceId') senderDeviceId = part.value as string
          if (part.fieldname === 'senderName') senderName = part.value as string
          if (part.fieldname === 'targetDeviceIds') {
            try {
              targetDeviceIds = JSON.parse(part.value as string)
            } catch {
              targetDeviceIds = (part.value as string).split(',').map((s) => s.trim()).filter(Boolean)
            }
          }
        } else if (part.type === 'file') {
          const filename = part.filename
          const check = isAllowedFile(filename)
          if (!check.allowed) {
            return reply.code(400).send({ error: 'file_not_allowed', reason: check.reason, filename })
          }

          const safeName = getSafeFilename(filename)
          const savePath = getUploadPath(safeName)
          const writeStream = fs.createWriteStream(savePath, { highWaterMark: 1024 * 1024 })
          part.file.pipe(writeStream)

          await new Promise<void>((resolve, reject) => {
            writeStream.on('finish', () => resolve())
            writeStream.on('error', reject)
          })

          const stat = fs.statSync(savePath)
          const meta = recordFile(filename, safeName, stat.size, senderDeviceId, senderName, targetDeviceIds)
          uploaded.push(meta)

          // Notify targeted or connected devices of new file
          sendWsMessage('files:new', { file: meta }, targetDeviceIds)
        }
      }

      return { ok: true, uploaded }
    })

    fastify.get('/files/list', async () => {
      const files = getFiles()
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

      const meta = getFileBySavedName(params.name)
      const downloadFilename = meta ? meta.originalName : params.name

      reply.header('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadFilename)}"`)
      return reply.send(fs.createReadStream(filePath, { highWaterMark: 1024 * 1024 }))
    })

    fastify.delete('/files/:name', async (request, reply) => {
      const params = request.params as { name: string }
      const ok = deleteFile(params.name)
      if (ok) {
        broadcastWS('files:delete', { savedName: params.name })
        return { ok: true }
      }
      return reply.code(404).send({ ok: false, error: 'not_found' })
    })

    // Text & Links Routes
    fastify.post('/text/send', async (request, reply) => {
      const parse = textMessageSchema.safeParse(request.body)
      if (!parse.success) {
        return reply.code(400).send({ error: 'invalid_payload' })
      }
      const { text, from, fromType, senderDeviceId, targetDeviceIds } = parse.data
      const msg = addTextMessage(text, from, fromType, senderDeviceId, targetDeviceIds)
      sendWsMessage('text:new', { message: msg }, targetDeviceIds)
      return { ok: true, message: msg }
    })

    fastify.get('/text/history', async () => {
      return { messages: getTextMessages() }
    })

    // Clipboard Routes
    fastify.post('/clipboard/sync', async (request, reply) => {
      const parse = clipboardSchema.safeParse(request.body)
      if (!parse.success) {
        return reply.code(400).send({ error: 'invalid_payload' })
      }
      const { text, from, fromType, senderDeviceId, targetDeviceIds } = parse.data
      const entry = setClipboard(text, from, fromType, senderDeviceId, targetDeviceIds)
      sendWsMessage('clipboard:updated', { clipboard: entry }, targetDeviceIds)
      return { ok: true, clipboard: entry }
    })

    fastify.get('/clipboard/latest', async () => {
      return { clipboard: getClipboard() }
    })

    // WebSocket Server Handler
    fastify.get('/ws', { websocket: true }, (socket: any, req: any) => {
      const origin = req.headers.origin
      if (origin) {
        const allowed =
          origin.includes('localhost') ||
          origin.includes('127.0.0.1') ||
          origin.includes('192.168.') ||
          origin.includes('10.') ||
          origin.includes('172.')
        if (!allowed) {
          socket.close()
          return
        }
      }

      socket.on('message', (message: any) => {
        try {
          const data = JSON.parse(message.toString())

          switch (data.type) {
            case 'ping':
              socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
              break

            case 'pair:hello':
              socket.send(JSON.stringify({ type: 'pair:ack', ok: true }))
              break

            case 'auth:identify': {
              if (data.token) {
                const session = validateDeviceToken(data.token)
                if (session) {
                  socket.deviceId = session.deviceId
                  socket.send(JSON.stringify({ type: 'auth:ok', deviceId: session.deviceId }))
                } else {
                  socket.send(JSON.stringify({ type: 'auth:error', reason: 'invalid_token' }))
                }
              } else if (data.deviceId) {
                socket.deviceId = data.deviceId
              }
              break
            }

            case 'device:register': {
              const dev = addDevice(data.name || 'Device', data.deviceType || 'phone')
              socket.deviceId = dev.id
              bindSession(socket.id || 'ws', dev.id)
              socket.send(JSON.stringify({ type: 'device:registered', device: dev, token: dev.token }))
              broadcastWS('devices:update', { devices: getDevices() })
              break
            }

            case 'devices:get':
              socket.send(JSON.stringify({ type: 'devices:update', devices: getDevices() }))
              break

            case 'text:send': {
              if (data.text) {
                const msg = addTextMessage(data.text, data.from, data.fromType, data.senderDeviceId, data.targetDeviceIds)
                sendWsMessage('text:new', { message: msg }, data.targetDeviceIds)
              }
              break
            }

            case 'clipboard:send': {
              if (typeof data.text === 'string') {
                const entry = setClipboard(data.text, data.from, data.fromType, data.senderDeviceId, data.targetDeviceIds)
                sendWsMessage('clipboard:updated', { clipboard: entry }, data.targetDeviceIds, socket)
              }
              break
            }

            // File transfer consent protocol
            case 'transfer:request': {
              // Sender requests recipient consent before uploading
              sendWsMessage('transfer:incoming', data.payload, data.targetDeviceIds, socket)
              break
            }

            case 'transfer:respond': {
              // Recipient responds with accept or reject
              sendWsMessage('transfer:decision', data.payload, data.targetDeviceIds ? [data.targetDeviceIds] : undefined, socket)
              break
            }

            // WebRTC Signaling with on-demand support
            case 'signal:offer':
            case 'signal:answer':
            case 'signal:ice':
            case 'signal:status':
            case 'screen:request_offer':
              if (data.targetDeviceIds && data.targetDeviceIds.length > 0) {
                sendWsMessage(data.type, { payload: data.payload, from: data.from }, data.targetDeviceIds, socket)
              } else {
                broadcastWS(data.type, { payload: data.payload, from: data.from }, socket)
              }
              break

            default:
              socket.send(JSON.stringify({ type: 'echo', data }))
              break
          }
        } catch (e) {
          socket.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }))
        }
      })

      socket.on('close', () => {
        unbindSession(socket.id || 'ws')
        if (socket.deviceId) {
          removeDevice(socket.deviceId)
          broadcastWS('devices:update', { devices: getDevices() })
        }
      })

      socket.send(
        JSON.stringify({
          type: 'welcome',
          message: 'LinkDesk Local WebSocket Connected',
          devices: getDevices()
        })
      )
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

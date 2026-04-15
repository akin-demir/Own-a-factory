import type { FastifyInstance } from 'fastify'
import type { WebSocket } from '@fastify/websocket'
import type { WSMessage, WSTagDeltaMessage, WSErrorMessage } from '@own-a-factory/types'

// In-memory room map: sessionId → Set of sockets
const rooms = new Map<string, Set<WebSocket>>()

function broadcast(sessionId: string, message: WSMessage, exclude?: WebSocket): void {
  const room = rooms.get(sessionId)
  if (!room) return
  const payload = JSON.stringify(message)
  for (const socket of room) {
    if (socket !== exclude && socket.readyState === 1 /* OPEN */) {
      socket.send(payload)
    }
  }
}

function joinRoom(sessionId: string, socket: WebSocket): void {
  if (!rooms.has(sessionId)) rooms.set(sessionId, new Set())
  rooms.get(sessionId)!.add(socket)
}

function leaveRoom(sessionId: string, socket: WebSocket): void {
  const room = rooms.get(sessionId)
  if (!room) return
  room.delete(socket)
  if (room.size === 0) rooms.delete(sessionId)
}

export async function wsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/ws', { websocket: true }, (socket, _request) => {
    let currentSessionId: string | null = null
    let userId: string | null = null

    socket.on('message', (raw: Buffer | string) => {
      let msg: WSMessage
      try {
        msg = JSON.parse(raw.toString()) as WSMessage
      } catch {
        const err: WSErrorMessage = { type: 'error', message: 'Invalid JSON', code: 'PARSE_ERROR' }
        socket.send(JSON.stringify(err))
        return
      }

      switch (msg.type) {
        case 'join': {
          // Verify JWT
          try {
            const decoded = app.jwt.verify<{ userId: string; email: string }>(msg.token)
            userId = decoded.userId
          } catch {
            const err: WSErrorMessage = { type: 'error', message: 'Invalid token', code: 'AUTH_ERROR' }
            socket.send(JSON.stringify(err))
            socket.close()
            return
          }

          currentSessionId = msg.sessionId
          joinRoom(currentSessionId, socket)

          // Confirm join
          socket.send(JSON.stringify({ type: 'joined', sessionId: currentSessionId, userId }))
          break
        }

        case 'tag_delta': {
          if (!currentSessionId) {
            const err: WSErrorMessage = { type: 'error', message: 'Must join a session first', code: 'NOT_JOINED' }
            socket.send(JSON.stringify(err))
            return
          }

          const delta: WSTagDeltaMessage = {
            type: 'tag_delta',
            sessionId: currentSessionId,
            tags: msg.tags,
            ...(userId ? { fromUserId: userId } : {}),
          }
          broadcast(currentSessionId, delta, socket)
          break
        }

        case 'status': {
          if (!currentSessionId) return
          broadcast(currentSessionId, msg, socket)
          break
        }

        case 'modbus_connect': {
          // Placeholder: Modbus proxy to be implemented
          socket.send(JSON.stringify({
            type: 'error',
            message: 'Modbus proxy not yet implemented',
            code: 'NOT_IMPLEMENTED',
          }))
          break
        }

        default: {
          const err: WSErrorMessage = { type: 'error', message: 'Unknown message type', code: 'UNKNOWN_TYPE' }
          socket.send(JSON.stringify(err))
        }
      }
    })

    socket.on('close', () => {
      if (currentSessionId) leaveRoom(currentSessionId, socket)
    })

    socket.on('error', () => {
      if (currentSessionId) leaveRoom(currentSessionId, socket)
    })
  })
}

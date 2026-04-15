import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

async function websocketPlugin(app: FastifyInstance): Promise<void> {
  await app.register(import('@fastify/websocket'))
}

export default fp(websocketPlugin)

import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

async function corsPlugin(app: FastifyInstance): Promise<void> {
  await app.register(import('@fastify/cors'), {
    origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:3000',
    credentials: true,
  })
}

export default fp(corsPlugin)

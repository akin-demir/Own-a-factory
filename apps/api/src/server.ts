import Fastify from 'fastify'
import authPlugin from './plugins/auth.js'
import corsPlugin from './plugins/cors.js'
import websocketPlugin from './plugins/websocket.js'
import { authRoutes } from './routes/auth.js'
import { projectRoutes } from './routes/projects.js'
import { sceneRoutes } from './routes/scenes.js'
import { componentRoutes } from './routes/components.js'
import { wsRoutes } from './routes/ws.js'

export async function buildServer() {
  const isDev = process.env['NODE_ENV'] !== 'production'
  const app = Fastify({
    logger: isDev
      ? { level: process.env['LOG_LEVEL'] ?? 'info', transport: { target: 'pino-pretty', options: { colorize: true } } }
      : { level: process.env['LOG_LEVEL'] ?? 'info' },
  })

  // Plugins
  await app.register(corsPlugin)
  await app.register(authPlugin)
  await app.register(websocketPlugin)

  // Routes
  await app.register(authRoutes)
  await app.register(projectRoutes)
  await app.register(sceneRoutes)
  await app.register(componentRoutes)
  await app.register(wsRoutes)

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  return app
}

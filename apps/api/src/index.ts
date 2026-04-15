import { buildServer } from './server.js'

const PORT = parseInt(process.env['PORT'] ?? '4000', 10)
const HOST = process.env['HOST'] ?? '0.0.0.0'

const app = await buildServer()

try {
  await app.listen({ port: PORT, host: HOST })
  console.log(`API server listening on http://${HOST}:${PORT}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}

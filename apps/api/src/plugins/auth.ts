import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string; email: string }
    user: { userId: string; email: string }
  }
}

async function authPlugin(app: FastifyInstance): Promise<void> {
  const secret = process.env['JWT_SECRET']
  if (!secret) throw new Error('JWT_SECRET environment variable is required')

  await app.register(import('@fastify/jwt'), {
    secret,
    sign: { expiresIn: '7d' },
  })

  app.decorate('authenticate', async function (request: Parameters<typeof app.authenticate>[0], reply: Parameters<typeof app.authenticate>[1]) {
    try {
      await request.jwtVerify()
    } catch {
      reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or expired token', statusCode: 401 })
    }
  })
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply) => Promise<void>
  }
}

export default fp(authPlugin)

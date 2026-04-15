import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db, users } from '../lib/db.js'
import type { RegisterRequest, LoginRequest } from '@own-a-factory/types'

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: RegisterRequest }>('/auth/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          name: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { email, password, name } = request.body

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (existing.length > 0) {
      return reply.code(409).send({
        error: 'Conflict',
        message: 'Email already registered',
        statusCode: 409,
      })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const [user] = await db
      .insert(users)
      .values({ email, passwordHash, name: name ?? null })
      .returning({ id: users.id, email: users.email, name: users.name, avatarUrl: users.avatarUrl })

    if (!user) return reply.code(500).send({ error: 'Internal Server Error', message: 'Failed to create user', statusCode: 500 })

    const token = app.jwt.sign({ userId: user.id, email: user.email })
    return reply.code(201).send({ token, user })
  })

  app.post<{ Body: LoginRequest }>('/auth/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string' },
          password: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { email, password } = request.body

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid credentials', statusCode: 401 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid credentials', statusCode: 401 })
    }

    const token = app.jwt.sign({ userId: user.id, email: user.email })
    return reply.send({
      token,
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
    })
  })

  app.get('/auth/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    const [user] = await db
      .select({ id: users.id, email: users.email, name: users.name, avatarUrl: users.avatarUrl })
      .from(users)
      .where(eq(users.id, request.user.userId))
      .limit(1)

    if (!user) return reply.code(404).send({ error: 'Not Found', message: 'User not found', statusCode: 404 })
    return reply.send(user)
  })
}

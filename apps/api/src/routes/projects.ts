import type { FastifyInstance } from 'fastify'
import { eq, and, desc } from 'drizzle-orm'
import { db, projects } from '../lib/db.js'
import type { CreateProjectRequest, UpdateProjectRequest } from '@own-a-factory/types'

export async function projectRoutes(app: FastifyInstance): Promise<void> {
  // List user's projects
  app.get('/projects', { preHandler: [app.authenticate] }, async (request, reply) => {
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.ownerId, request.user.userId))
      .orderBy(desc(projects.updatedAt))

    return reply.send(rows)
  })

  // Create project
  app.post<{ Body: CreateProjectRequest }>('/projects', {
    preHandler: [app.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1 },
          description: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { name, description } = request.body
    const [project] = await db
      .insert(projects)
      .values({ name, description: description ?? null, ownerId: request.user.userId })
      .returning()

    if (!project) return reply.code(500).send({ error: 'Internal Server Error', message: 'Failed to create project', statusCode: 500 })
    return reply.code(201).send(project)
  })

  // Get single project
  app.get<{ Params: { id: string } }>('/projects/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, request.params.id), eq(projects.ownerId, request.user.userId)))
      .limit(1)

    if (!project) return reply.code(404).send({ error: 'Not Found', message: 'Project not found', statusCode: 404 })
    return reply.send(project)
  })

  // Update project
  app.patch<{ Params: { id: string }; Body: UpdateProjectRequest }>('/projects/:id', {
    preHandler: [app.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          description: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { name, description } = request.body
    const updates: Partial<typeof projects.$inferInsert> = { updatedAt: new Date() }
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description

    const [updated] = await db
      .update(projects)
      .set(updates)
      .where(and(eq(projects.id, request.params.id), eq(projects.ownerId, request.user.userId)))
      .returning()

    if (!updated) return reply.code(404).send({ error: 'Not Found', message: 'Project not found', statusCode: 404 })
    return reply.send(updated)
  })

  // Delete project
  app.delete<{ Params: { id: string } }>('/projects/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const [deleted] = await db
      .delete(projects)
      .where(and(eq(projects.id, request.params.id), eq(projects.ownerId, request.user.userId)))
      .returning({ id: projects.id })

    if (!deleted) return reply.code(404).send({ error: 'Not Found', message: 'Project not found', statusCode: 404 })
    return reply.code(204).send()
  })
}

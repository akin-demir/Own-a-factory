import type { FastifyInstance } from 'fastify'
import { eq, and, desc, sql } from 'drizzle-orm'
import { db, scenes, projects } from '../lib/db.js'
import type { SaveSceneRequest } from '@own-a-factory/types'

const MAX_AUTOSAVES = 20

export async function sceneRoutes(app: FastifyInstance): Promise<void> {
  // List scene versions for a project
  app.get<{ Params: { projectId: string } }>(
    '/projects/:projectId/scenes',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      // Verify project ownership
      const [project] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.id, request.params.projectId), eq(projects.ownerId, request.user.userId)))
        .limit(1)

      if (!project) return reply.code(404).send({ error: 'Not Found', message: 'Project not found', statusCode: 404 })

      const rows = await db
        .select({
          id: scenes.id,
          projectId: scenes.projectId,
          version: scenes.version,
          isManual: scenes.isManual,
          label: scenes.label,
          createdAt: scenes.createdAt,
        })
        .from(scenes)
        .where(eq(scenes.projectId, request.params.projectId))
        .orderBy(desc(scenes.version))

      return reply.send(rows)
    },
  )

  // Get latest scene data
  app.get<{ Params: { projectId: string } }>(
    '/projects/:projectId/scenes/latest',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const [project] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.id, request.params.projectId), eq(projects.ownerId, request.user.userId)))
        .limit(1)

      if (!project) return reply.code(404).send({ error: 'Not Found', message: 'Project not found', statusCode: 404 })

      const [scene] = await db
        .select()
        .from(scenes)
        .where(eq(scenes.projectId, request.params.projectId))
        .orderBy(desc(scenes.version))
        .limit(1)

      if (!scene) return reply.code(404).send({ error: 'Not Found', message: 'No scene saved yet', statusCode: 404 })
      return reply.send(scene)
    },
  )

  // Get specific scene version
  app.get<{ Params: { projectId: string; version: string } }>(
    '/projects/:projectId/scenes/:version',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const version = parseInt(request.params.version, 10)
      if (isNaN(version)) return reply.code(400).send({ error: 'Bad Request', message: 'Invalid version', statusCode: 400 })

      const [project] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.id, request.params.projectId), eq(projects.ownerId, request.user.userId)))
        .limit(1)

      if (!project) return reply.code(404).send({ error: 'Not Found', message: 'Project not found', statusCode: 404 })

      const [scene] = await db
        .select()
        .from(scenes)
        .where(and(eq(scenes.projectId, request.params.projectId), eq(scenes.version, version)))
        .limit(1)

      if (!scene) return reply.code(404).send({ error: 'Not Found', message: 'Scene version not found', statusCode: 404 })
      return reply.send(scene)
    },
  )

  // Save scene (autosave or manual)
  app.post<{ Params: { projectId: string }; Body: SaveSceneRequest }>(
    '/projects/:projectId/scenes',
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['data'],
          properties: {
            data: { type: 'object' },
            isManual: { type: 'boolean' },
            label: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const [project] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.id, request.params.projectId), eq(projects.ownerId, request.user.userId)))
        .limit(1)

      if (!project) return reply.code(404).send({ error: 'Not Found', message: 'Project not found', statusCode: 404 })

      const { data, isManual = false, label } = request.body

      // Get next version number
      const result = await db
        .select({ maxVersion: sql<number>`coalesce(max(${scenes.version}), 0)` })
        .from(scenes)
        .where(eq(scenes.projectId, request.params.projectId))

      const nextVersion = (result[0]?.maxVersion ?? 0) + 1

      const [saved] = await db
        .insert(scenes)
        .values({
          projectId: request.params.projectId,
          version: nextVersion,
          data,
          isManual,
          label: label ?? null,
        })
        .returning()

      if (!saved) return reply.code(500).send({ error: 'Internal Server Error', message: 'Failed to save scene', statusCode: 500 })

      // Update project updatedAt
      await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, request.params.projectId))

      // Prune old autosaves (keep last MAX_AUTOSAVES, never delete manual saves)
      if (!isManual) {
        const autosaves = await db
          .select({ id: scenes.id, version: scenes.version })
          .from(scenes)
          .where(and(eq(scenes.projectId, request.params.projectId), eq(scenes.isManual, false)))
          .orderBy(desc(scenes.version))

        if (autosaves.length > MAX_AUTOSAVES) {
          const toDelete = autosaves.slice(MAX_AUTOSAVES).map((s) => s.id)
          for (const id of toDelete) {
            await db.delete(scenes).where(eq(scenes.id, id))
          }
        }
      }

      return reply.code(201).send(saved)
    },
  )
}

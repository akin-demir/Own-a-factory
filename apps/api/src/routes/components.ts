import type { FastifyInstance } from 'fastify'
import { eq, and, sql } from 'drizzle-orm'
import { db, componentTypes, componentAssets } from '../lib/db.js'
import type { ComponentCategory } from '@own-a-factory/types'

export async function componentRoutes(app: FastifyInstance): Promise<void> {
  // List components (optionally filtered by category/tier)
  app.get<{ Querystring: { category?: string; tier?: string; search?: string } }>(
    '/components',
    async (request, reply) => {
      const { category, tier, search } = request.query

      let query = db
        .select({
          id: componentTypes.id,
          parentId: componentTypes.parentId,
          tier: componentTypes.tier,
          definition: componentTypes.definition,
          published: componentTypes.published,
          createdAt: componentTypes.createdAt,
        })
        .from(componentTypes)
        .$dynamic()

      const conditions = [eq(componentTypes.published, true)]

      if (tier) conditions.push(eq(componentTypes.tier, tier as 'platform' | 'community' | 'user'))

      query = query.where(and(...conditions))

      const rows = await query

      // Filter by category and search in JS (definition is JSONB)
      let results = rows
      if (category) {
        results = results.filter(
          (r) => (r.definition as { category?: string }).category === category,
        )
      }
      if (search) {
        const q = search.toLowerCase()
        results = results.filter((r) => {
          const def = r.definition as { displayName?: string; description?: string }
          return (
            def.displayName?.toLowerCase().includes(q) ||
            def.description?.toLowerCase().includes(q) ||
            r.id.toLowerCase().includes(q)
          )
        })
      }

      return reply.send(results)
    },
  )

  // Get single component with assets
  app.get<{ Params: { id: string } }>('/components/:id', async (request, reply) => {
    const [component] = await db
      .select()
      .from(componentTypes)
      .where(eq(componentTypes.id, request.params.id))
      .limit(1)

    if (!component) {
      return reply.code(404).send({ error: 'Not Found', message: 'Component not found', statusCode: 404 })
    }

    const assets = await db
      .select()
      .from(componentAssets)
      .where(eq(componentAssets.componentId, request.params.id))

    const assetMap: Record<string, string> = {}
    for (const asset of assets) {
      assetMap[asset.assetType] = `/assets/${asset.storageKey}`
    }

    return reply.send({ ...component, assets: assetMap })
  })

  // Register a new component (authenticated, for user-tier components)
  app.post<{ Body: { id: string; definition: unknown } }>(
    '/components',
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['id', 'definition'],
          properties: {
            id: { type: 'string', pattern: '^[a-z0-9-]+$' },
            definition: { type: 'object' },
          },
        },
      },
    },
    async (request, reply) => {
      const { id, definition } = request.body

      const existing = await db.select({ id: componentTypes.id }).from(componentTypes).where(eq(componentTypes.id, id)).limit(1)
      if (existing.length > 0) {
        return reply.code(409).send({ error: 'Conflict', message: 'Component ID already exists', statusCode: 409 })
      }

      const [component] = await db
        .insert(componentTypes)
        .values({
          id,
          tier: 'user',
          ownerId: request.user.userId,
          definition: definition as typeof componentTypes.$inferInsert.definition,
          published: false,
        })
        .returning()

      return reply.code(201).send(component)
    },
  )
}

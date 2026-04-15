import { pgTable, text, timestamp, uuid, boolean, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users.js'

export const componentTierEnum = pgEnum('component_tier', ['platform', 'community', 'user'])
export const assetTypeEnum = pgEnum('asset_type', ['mesh', 'thumbnail', 'icon', 'behavior'])

export const componentTypes = pgTable('component_types', {
  id: text('id').primaryKey(), // e.g. "ir-proximity-generic"
  parentId: text('parent_id'), // self-reference handled in relations
  tier: componentTierEnum('tier').notNull().default('platform'),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
  definition: jsonb('definition').notNull(),
  published: boolean('published').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const componentAssets = pgTable('component_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  componentId: text('component_id')
    .notNull()
    .references(() => componentTypes.id, { onDelete: 'cascade' }),
  assetType: assetTypeEnum('asset_type').notNull(),
  storageKey: text('storage_key').notNull(),
  contentType: text('content_type'),
  sizeBytes: integer('size_bytes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const componentTypesRelations = relations(componentTypes, ({ one, many }) => ({
  owner: one(users, { fields: [componentTypes.ownerId], references: [users.id] }),
  parent: one(componentTypes, {
    fields: [componentTypes.parentId],
    references: [componentTypes.id],
    relationName: 'parent_child',
  }),
  children: many(componentTypes, { relationName: 'parent_child' }),
  assets: many(componentAssets),
}))

export const componentAssetsRelations = relations(componentAssets, ({ one }) => ({
  component: one(componentTypes, {
    fields: [componentAssets.componentId],
    references: [componentTypes.id],
  }),
}))

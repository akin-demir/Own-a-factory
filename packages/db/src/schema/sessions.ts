import { pgTable, timestamp, uuid, boolean, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users.js'
import { projects } from './projects.js'

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  isRecording: boolean('is_recording').notNull().default(false),
})

export const tagHistory = pgTable('tag_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  ts: timestamp('ts', { withTimezone: true }).notNull().defaultNow(),
  tags: jsonb('tags').notNull(),
})

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  project: one(projects, { fields: [sessions.projectId], references: [projects.id] }),
  owner: one(users, { fields: [sessions.ownerId], references: [users.id] }),
  tagHistory: many(tagHistory),
}))

export const tagHistoryRelations = relations(tagHistory, ({ one }) => ({
  session: one(sessions, { fields: [tagHistory.sessionId], references: [sessions.id] }),
}))

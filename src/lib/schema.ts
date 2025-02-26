import { sqliteTable, text } from 'drizzle-orm/sqlite-core';


export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time'),
  status: text('status').notNull(), // 'recording', 'captured', 'processing', 'complete', 'error'
  createdAt: text('created_at').notNull()
});

export const rawData = sqliteTable('raw_data', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id),
  data: text('data').notNull(),
  capturedAt: text('captured_at').notNull()
});

export const processedData = sqliteTable('processed_data', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id),
  data: text('data').notNull(),
  processedAt: text('processed_at').notNull()
});
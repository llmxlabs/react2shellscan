import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { createId } from '@paralleldrive/cuid2'

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').unique().notNull(),
  name: text('name'),
  plan: text('plan', { enum: ['free', 'pro', 'enterprise'] }).default('free'),
  scansToday: integer('scans_today').default(0),
  scansResetAt: integer('scans_reset_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const scans = sqliteTable('scans', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').references(() => users.id),
  url: text('url').notNull(),
  normalizedUrl: text('normalized_url').notNull(), // For deduplication
  status: text('status', {
    enum: ['pending', 'running', 'complete', 'error']
  }).default('pending'),

  // Results
  vulnerable: integer('vulnerable', { mode: 'boolean' }),
  confidence: text('confidence', { enum: ['high', 'medium', 'low'] }),
  usesRsc: integer('uses_rsc', { mode: 'boolean' }),
  framework: text('framework'), // 'nextjs', 'remix', 'waku', etc.
  detectedVersion: text('detected_version'),

  // Detection details
  httpStatus: integer('http_status'),
  errorSignature: text('error_signature'),
  rawResponse: text('raw_response'), // First 1000 chars for debugging

  // Meta
  authorizationConfirmed: integer('authorization_confirmed', { mode: 'boolean' }).default(false),
  scanDurationMs: integer('scan_duration_ms'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),

  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
})

// For caching recent scans of the same URL
export const scanCache = sqliteTable('scan_cache', {
  normalizedUrl: text('normalized_url').primaryKey(),
  lastScanId: text('last_scan_id').references(() => scans.id),
  vulnerable: integer('vulnerable', { mode: 'boolean' }),
  confidence: text('confidence'),
  cachedAt: integer('cached_at', { mode: 'timestamp' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
})

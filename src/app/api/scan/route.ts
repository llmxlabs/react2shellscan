import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { scans, scanCache } from '@/lib/db/schema'
import { detectReact2Shell, normalizeUrl } from '@/lib/scanner/detect'
import { eq } from 'drizzle-orm'
import { ratelimit } from '@/lib/ratelimit'

const scanRequestSchema = z.object({
  url: z.string().url(),
  authorizationConfirmed: z.boolean().refine(val => val === true, {
    message: 'Authorization must be confirmed',
  }),
  // Honeypot field - should be empty
  website: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    if (ratelimit) {
      const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
      const { success, limit, reset, remaining } = await ratelimit.limit(
        `ratelimit_scan_${ip}`
      )

      if (!success) {
        return NextResponse.json(
          { 
            error: 'Too many requests',
            message: 'Please wait before starting another scan.' 
          },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toString(),
            }
          }
        )
      }
    }

    const body = await request.json()
    const { url, authorizationConfirmed, website } = scanRequestSchema.parse(body)

    // Honeypot check
    if (website) {
      return NextResponse.json(
        { error: 'Bot detected' },
        { status: 400 }
      )
    }

    // Check cache first
    const normalizedUrl = normalizeUrl(url)
    const cachedResult = await db
      .select()
      .from(scanCache)
      .where(eq(scanCache.normalizedUrl, normalizedUrl))
      .limit(1)

    if (cachedResult.length > 0) {
      const cache = cachedResult[0]
      if (cache.expiresAt && cache.lastScanId && new Date() < new Date(cache.expiresAt)) {
        // Return cached result
        const scanResult = await db
          .select()
          .from(scans)
          .where(eq(scans.id, cache.lastScanId))
          .limit(1)

        if (scanResult.length > 0) {
          return NextResponse.json({
            id: scanResult[0].id,
            status: 'complete',
            url: scanResult[0].url,
            result: {
              vulnerable: scanResult[0].vulnerable,
              confidence: scanResult[0].confidence,
              usesRsc: scanResult[0].usesRsc,
              framework: scanResult[0].framework,
              detectedVersion: scanResult[0].detectedVersion,
              message: 'Cached result',
            },
            cached: true,
            createdAt: scanResult[0].createdAt,
          })
        }
      }
    }

    // Create scan record
    const scanId = crypto.randomUUID()
    await db.insert(scans).values({
      id: scanId,
      url,
      normalizedUrl,
      status: 'running',
      authorizationConfirmed,
    })

    // Run scan asynchronously
    detectReact2Shell(url).then(async (result) => {
      // Update scan record
      await db
        .update(scans)
        .set({
          status: 'complete',
          vulnerable: result.vulnerable,
          confidence: result.confidence,
          usesRsc: result.usesRsc,
          framework: result.framework,
          detectedVersion: result.detectedVersion,
          httpStatus: result.httpStatus,
          errorSignature: result.errorSignature,
          scanDurationMs: result.durationMs,
          completedAt: new Date(),
        })
        .where(eq(scans.id, scanId))

      // Update cache
      await db
        .insert(scanCache)
        .values({
          normalizedUrl,
          lastScanId: scanId,
          vulnerable: result.vulnerable,
          confidence: result.confidence,
          cachedAt: new Date(),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        })
        .onConflictDoUpdate({
          target: scanCache.normalizedUrl,
          set: {
            lastScanId: scanId,
            vulnerable: result.vulnerable,
            confidence: result.confidence,
            cachedAt: new Date(),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          },
        })
    }).catch(async (error) => {
      // Update scan record with error
      await db
        .update(scans)
        .set({
          status: 'error',
          completedAt: new Date(),
        })
        .where(eq(scans.id, scanId))
    })

    return NextResponse.json({
      id: scanId,
      status: 'running',
      url,
      createdAt: new Date(),
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Scan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

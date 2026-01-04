import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { scans } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: scanId } = await params

    const scanResult = await db
      .select()
      .from(scans)
      .where(eq(scans.id, scanId))
      .limit(1)

    if (scanResult.length === 0) {
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      )
    }

    const scan = scanResult[0]

    const response: any = {
      id: scan.id,
      status: scan.status,
      url: scan.url,
      createdAt: scan.createdAt,
    }

    if (scan.status === 'complete') {
      response.result = {
        vulnerable: scan.vulnerable,
        confidence: scan.confidence,
        usesRsc: scan.usesRsc,
        framework: scan.framework,
        detectedVersion: scan.detectedVersion,
        message: scan.vulnerable
          ? `VULNERABLE: Site is affected by React2Shell (CVE-2025-55182). ${scan.framework ? `Detected framework: ${scan.framework}` : ''} ${scan.detectedVersion ? `v${scan.detectedVersion}` : ''}`.trim()
          : scan.usesRsc
            ? 'Site uses RSC but appears to be patched or protected.'
            : 'Site does not appear to use React Server Components. Not vulnerable.',
      }
    } else if (scan.status === 'error') {
      response.error = 'Scan failed'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Get scan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

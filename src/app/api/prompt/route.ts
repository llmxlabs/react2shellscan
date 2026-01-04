import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { scans } from '@/lib/db/schema'
import { generatePrompt } from '@/lib/prompts/templates'
import { eq } from 'drizzle-orm'

const promptRequestSchema = z.object({
  scanId: z.string(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scanId = searchParams.get('scanId')

    if (!scanId) {
      return NextResponse.json(
        { error: 'scanId parameter is required' },
        { status: 400 }
      )
    }

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

    if (scan.status !== 'complete' || !scan.vulnerable) {
      return NextResponse.json(
        { error: 'Prompt only available for completed vulnerable scans' },
        { status: 400 }
      )
    }

    // Reconstruct ScanResult from database
    const result = {
      vulnerable: scan.vulnerable!,
      confidence: scan.confidence! as 'high' | 'medium' | 'low',
      usesRsc: scan.usesRsc!,
      framework: scan.framework,
      detectedVersion: scan.detectedVersion,
      httpStatus: scan.httpStatus,
      errorSignature: scan.errorSignature,
      message: '',
      durationMs: scan.scanDurationMs || 0,
    }

    const { prompt, shortPrompt, manualSteps } = generatePrompt({
      url: scan.url,
      result,
    })

    return NextResponse.json({
      scanId,
      prompt,
      shortPrompt,
      manualSteps,
    })

  } catch (error) {
    console.error('Get prompt error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

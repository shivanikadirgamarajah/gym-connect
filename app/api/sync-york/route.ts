import { NextResponse } from 'next/server'
import { syncYorkProgram } from '@/lib/syncYorkProgram'

export async function GET() {
  try {
    const data = await syncYorkProgram()

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('TEST SYNC ROUTE ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

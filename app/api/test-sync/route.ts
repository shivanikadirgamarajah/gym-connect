import { syncYorkProgram } from '@/lib/syncYorkProgram'

export async function GET() {
  const data = await syncYorkProgram()
  return Response.json({ success: true, data })
}

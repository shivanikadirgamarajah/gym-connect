import { supabaseAdmin } from '../app/supabase/supabase-admin'
import { syncOneProgram } from '../app/src/syncYorkProgram'

type SyncResult = {
  program_id: string
  sport_name: string
  success: boolean
  message: string
}

export async function runFullYorkSync() {
  const { data: programs, error } = await supabaseAdmin
    .from('program_sources')
    .select('*')
    .eq('active', true)

  if (error) {
    throw new Error(`Could not load program_sources: ${error.message}`)
  }

  const results: SyncResult[] = []

  for (const program of programs ?? []) {
    
    try {
      await syncOneProgram(program.program_id, program.sport_name)

      results.push({
        program_id: program.program_id,
        sport_name: program.sport_name,
        success: true,
        message: 'Synced successfully',
      })
    } catch (err) {
      results.push({
        program_id: program.program_id,
        sport_name: program.sport_name,
        success: false,
        message: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return {
    total: results.length,
    successCount: results.filter((r) => r.success).length,
    failureCount: results.filter((r) => !r.success).length,
    results,
  }
}
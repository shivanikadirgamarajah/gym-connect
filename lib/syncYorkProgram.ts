import { supabaseAdmin } from '../app/supabase/supabase-admin'

async function fetchYorkAppointments(programId: string) {
  const response = await fetch(
    `https://reconline.yorkulions.ca/Program/GetProgramInstances?programID=${programId}`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    }
  )

  const html = await response.text()

  return html
}

function extractAppointmentsFromHtml(html: string) {
  const appointments: any[] = []

  const keyValueRegex = /appointments\[(\d+)]\[(.+?)]\r?\n([^\r\n]*)/g

  for (const match of html.matchAll(keyValueRegex)) {
    const indexNumber = Number(match[1])
    const field = match[2]
    const value = match[3] ?? ''

    if (!appointments[indexNumber]) {
      appointments[indexNumber] = {}
    }

    appointments[indexNumber][field] = value
  }

  return appointments.filter((appt) => appt?.StartDate && appt?.EndDate)
}

function mapAppointmentsToRows(
  appointments: any[],
  programId: string,
  sourceUrl: string
) {
  return appointments.map((appt) => ({
    program_id: programId,
    sport_name: appt.ProductName || 'Drop-In Session',
    source_url: sourceUrl,
    session_key: `${programId}_${appt.StartDate}_${appt.EndDate}_${appt.Location ?? 'unknown'}`,
    is_active: true,
    last_synced_at: new Date().toISOString(),
  }))
}

export async function syncYorkProgram() {
  const programId =
    process.env.TEST_YORK_PROGRAM_ID ?? 'f95e69d2-105a-41d1-b63e-8ce0906a63bf'

  const html = await fetchYorkAppointments(programId)

  const appointments = extractAppointmentsFromHtml(html)

  console.log('APPOINTMENTS FOUND:', appointments.length)

  const rows = mapAppointmentsToRows(
    appointments,
    programId,
    `https://reconline.yorkulions.ca/Program/GetProgramDetails?courseId=${programId}`
  )

  const { data, error } = await supabaseAdmin
    .from('dropin_sessions')
    .upsert(rows, { onConflict: 'session_key' })
    .select()

  if (error) {
    console.error(error)
    throw error
  }

  return data
}
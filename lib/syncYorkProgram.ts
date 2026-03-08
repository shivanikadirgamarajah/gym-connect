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
  const matches = [
    ...html.matchAll(/appointments\[(\d+)]\[(\w+)]\s*([\s\S]*?)(?=appointments|\n\n|$)/g),
  ]

  const appointments: any[] = []

  const temp: Record<string, any> = {}

  html.split('\n').forEach((line) => {
    const parts = line.split('\t')

    if (parts.length === 2) {
      const key = parts[0]
      const value = parts[1]

      const match = key.match(/appointments\[(\d+)]\[(.+)]/)

      if (match) {
        const index = match[1]
        const field = match[2]
        const indexNumber = Number(index)

        if (!appointments[indexNumber]) appointments[indexNumber] = {}

        appointments[indexNumber][field] = value
      }
    }
  })

  return appointments.filter(Boolean)
}

function mapAppointmentsToRows(
  appointments: any[],
  programId: string,
  sourceUrl: string
) {
  return appointments.map((appt) => ({
    program_id: programId,
    sport_name: appt.ProductName || 'Drop-In Session',
    session_date: appt.StartDate.slice(0, 10),
    start_time: new Date(appt.StartDate).toLocaleTimeString(),
    end_time: new Date(appt.EndDate).toLocaleTimeString(),
    location: appt.Location || null,
    spots_available: appt.ClassSize ? Number(appt.ClassSize) : null,
    source_url: sourceUrl,
    york_appointment_id: appt.ID,
    session_key: `${programId}_${appt.StartDate}_${appt.Location}`,
    is_active: true,
    last_synced_at: new Date().toISOString(),
  }))
}

export async function syncYorkProgram() {
  const programId = 'c35f024c-0824-4487-bfb1-83ab0bb5b41c'

  const html = await fetchYorkAppointments(programId)

  const appointments = extractAppointmentsFromHtml(html)

  console.log('APPOINTMENTS FOUND:', appointments.length)

  const rows = mapAppointmentsToRows(
    appointments,
    programId,
    `https://reconline.yorkulions.ca/Program/GetProgramInstances?programID=${programId}`
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
import * as cheerio from 'cheerio'
import { supabaseAdmin } from '../supabase/supabase-admin'

type YorkAppointment = {
  ID: string
  StartDate: string
  EndDate: string
  Location: string
  ProductName: string
  ClassSize: string | number
}

function formatDatePart(isoString: string) {
  return isoString.slice(0, 10)
}

function formatTimePart(isoString: string) {
  const date = new Date(isoString)
  return date.toLocaleTimeString('en-CA', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function buildSessionKey(
  programId: string,
  startDate: string,
  endDate: string,
  location: string | null
) {
  return `${programId}__${startDate}__${endDate}__${location ?? 'unknown'}`
}

function mapAppointmentsToRows(
  appointments: YorkAppointment[],
  programId: string,
  sourceUrl: string
) {
  return appointments.map((appt) => ({
    program_id: programId,
    sport_name: appt.ProductName || 'Drop-In Session',
    session_date: formatDatePart(appt.StartDate),
    start_time: formatTimePart(appt.StartDate),
    end_time: formatTimePart(appt.EndDate),
    location: appt.Location || null,
    spots_available: appt.ClassSize ? Number(appt.ClassSize) : null,
    source_url: sourceUrl,
    york_appointment_id: appt.ID,
    session_key: buildSessionKey(
      programId,
      appt.StartDate,
      appt.EndDate,
      appt.Location || null
    ),
    is_active: true,
    last_synced_at: new Date().toISOString(),
  }))
}

function parseTimeRange(input: string): { start: string; end: string } {
  const match = input.match(/(\d{1,2}:\d{2}\s?[AP]M)\s*-\s*(\d{1,2}:\d{2}\s?[AP]M)/i)
  if (!match) {
    return { start: '', end: '' }
  }

  return {
    start: match[1].trim(),
    end: match[2].trim(),
  }
}

function parseSpots(input: string): number | null {
  const match = input.match(/(\d+)\s+Spots available/i)
  return match ? Number(match[1]) : null
}

function parseDate(input: string): string | null {
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

export async function syncOneProgram(programId: string, sportName: string) {
  const sourceUrl =
    `https://reconline.yorkulions.ca/Program/GetProgramInstances?programID=${programId}`

  const response = await fetch(sourceUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    await supabaseAdmin.from('sync_logs').insert({
      program_id: programId,
      success: false,
      message: `Fetch failed with status ${response.status}`,
    })
    throw new Error(`Fetch failed: ${response.status}`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)
  const text = $.text()

  const sessionRegex =
    /([A-Za-z]+,\s+[A-Za-z]+\s+\d{1,2},\s+\d{4})[\s\S]{0,400}?(\d{1,2}:\d{2}\s?[AP]M\s*-\s*\d{1,2}:\d{2}\s?[AP]M)/gi

  const appointments: YorkAppointment[] = []
  const seenSessionKeys = new Set<string>()
  const matches = [...text.matchAll(sessionRegex)]

  for (let i = 0; i < matches.length; i += 1) {
    const blockMatch = matches[i]
    const rawDate = blockMatch[1]
    const rawTimeRange = blockMatch[2]
    const startIndex = blockMatch.index ?? 0
    const nextStartIndex = matches[i + 1]?.index ?? text.length
    const blockText = text.slice(startIndex, nextStartIndex)

    const parsedDate = parseDate(rawDate)
    const timeRange = parseTimeRange(rawTimeRange)
    const spotsMatch = blockText.match(/(\d+)\s+Spots available/i)
    const locationMatch = blockText.match(/location_on\s+([^\n\r]+)/i)
    const location = locationMatch ? locationMatch[1].trim() : null
    const spotsAvailable = spotsMatch ? parseSpots(spotsMatch[0]) : null

    if (!parsedDate || !timeRange.start || !timeRange.end) {
      continue
    }

    const sessionKey = buildSessionKey(
      programId,
      `${parsedDate} ${timeRange.start}`,
      `${parsedDate} ${timeRange.end}`,
      location
    )

    if (seenSessionKeys.has(sessionKey)) {
      continue
    }

    seenSessionKeys.add(sessionKey)

    appointments.push({
      ID: sessionKey,
      StartDate: `${parsedDate} ${timeRange.start}`,
      EndDate: `${parsedDate} ${timeRange.end}`,
      Location: location ?? '',
      ProductName: sportName,
      ClassSize: spotsAvailable ?? '',
    })
  }

  if (appointments.length === 0) {
    await supabaseAdmin.from('sync_logs').insert({
      program_id: programId,
      success: false,
      message: 'Could not parse date or time from York response',
    })
    throw new Error('Could not parse date or time')
  }

  const today = new Date().toISOString().slice(0, 10)

  const { error: deactivateError } = await supabaseAdmin
    .from('dropin_sessions')
    .update({ is_active: false })
    .eq('program_id', programId)
    .gte('session_date', today)

  if (deactivateError) {
    throw new Error(`Failed to deactivate old sessions: ${deactivateError.message}`)
  }

  const rows = mapAppointmentsToRows(appointments, programId, sourceUrl)

  const { error } = await supabaseAdmin
    .from('dropin_sessions')
    .upsert(rows, { onConflict: 'session_key' })

  if (error) {
    await supabaseAdmin.from('sync_logs').insert({
      program_id: programId,
      success: false,
      message: error.message,
    })
    throw error
  }

  await supabaseAdmin.from('sync_logs').insert({
    program_id: programId,
    success: true,
    message: 'Sync completed successfully',
  })

  return rows
}
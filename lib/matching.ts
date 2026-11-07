
export type BuddyRequest = {
  id: string;
  userId: string;
  sport: string;
  date: string;
  startTime: string;
  endTime: string;
};

export type RankedMatch = {
  request: BuddyRequest;
  overlapMinutes: number;
};

function toMinutes(time: string): number {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return NaN;
  }

  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function getOverlapMinutes(
  a: BuddyRequest,
  b: BuddyRequest
): number {
  if (a.userId === b.userId) return 0;

  if (
    a.sport.trim().toLowerCase() !==
    b.sport.trim().toLowerCase()
  ) return 0;

  if (a.date !== b.date) return 0;

  const startA = toMinutes(a.startTime);
  const endA = toMinutes(a.endTime);
  const startB = toMinutes(b.startTime);
  const endB = toMinutes(b.endTime);

  if (
    ![startA, endA, startB, endB].every(Number.isFinite)
  ) return 0;

  if (startA >= endA || startB >= endB) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(endA, endB) - Math.max(startA, startB)
  );
}

export function isMatch(
  a: BuddyRequest,
  b: BuddyRequest,
  minOverlapMinutes = 1
): boolean {
  if (!Number.isInteger(minOverlapMinutes) ||
      minOverlapMinutes < 1) {
    throw new RangeError("Minimum overlap must be positive");
  }

  return getOverlapMinutes(a, b) >= minOverlapMinutes;
}

export function findMatches(
  request: BuddyRequest,
  candidates: BuddyRequest[],
  minOverlapMinutes = 15
): RankedMatch[] {
  if (!Number.isInteger(minOverlapMinutes) ||
      minOverlapMinutes < 1) {
    throw new RangeError("Minimum overlap must be positive");
  }

  const bestByUser = new Map<string, RankedMatch>();

  for (const candidate of candidates) {
    const overlapMinutes = getOverlapMinutes(
      request,
      candidate
    );

    if (overlapMinutes < minOverlapMinutes) continue;

    const existing = bestByUser.get(candidate.userId);

    if (
      !existing ||
      overlapMinutes > existing.overlapMinutes
    ) {
      bestByUser.set(candidate.userId, {
        request: candidate,
        overlapMinutes,
      });
    }
  }

  return [...bestByUser.values()].sort(
    (a, b) =>
      b.overlapMinutes - a.overlapMinutes ||
      a.request.id.localeCompare(b.request.id)
  );
}

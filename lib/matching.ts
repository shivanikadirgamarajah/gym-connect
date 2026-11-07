
export type BuddyRequest = {
  id: string;
  userId: string;
  sport: string;
  date: string;
  startTime: string;
  endTime: string;
};

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function isMatch(
  a: BuddyRequest,
  b: BuddyRequest
): boolean {
  // A student cannot match with themselves
  if (a.userId === b.userId) return false;

  // Sports must match
  if (a.sport.trim().toLowerCase() !==
      b.sport.trim().toLowerCase()) {
    return false;
  }

  // Dates must match
  if (a.date !== b.date) return false;

  const startA = toMinutes(a.startTime);
  const endA = toMinutes(a.endTime);
  const startB = toMinutes(b.startTime);
  const endB = toMinutes(b.endTime);

  // Reject invalid time ranges
  if (startA >= endA || startB >= endB) {
    return false;
  }

  // Check whether the time ranges overlap
  return startA < endB && startB < endA;
}

/** `YYYY-MM-DD` in UTC — matches claim API and DB calendar dates. */
export function utcCalendarDateToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Keys can be claimed through the event calendar day (UTC); blocked starting the next UTC day. */
export function isKeyClaimAllowedForEventDate(eventDate: string): boolean {
  return utcCalendarDateToday() <= eventDate;
}

/**
 * OpenRouter `expires_at`: first instant of the UTC calendar day after the day
 * that is one calendar day after `eventDate` (so the key is valid through the
 * full UTC day following the event).
 */
export function openRouterKeyExpiresAtIso(eventDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(eventDate);
  if (!match) {
    throw new Error(`Invalid eventDate: ${eventDate}`);
  }
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  return new Date(Date.UTC(y, m - 1, d + 2, 0, 0, 0, 0)).toISOString();
}

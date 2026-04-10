/** `YYYY-MM-DD` in UTC — matches claim API and DB calendar dates. */
export function utcCalendarDateToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Keys can be claimed through the event calendar day (UTC); blocked starting the next UTC day. */
export function isKeyClaimAllowedForEventDate(eventDate: string): boolean {
  return utcCalendarDateToday() <= eventDate;
}

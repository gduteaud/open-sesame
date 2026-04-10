/** Calendar date from DB as `YYYY-MM-DD` — format in local timezone (no UTC shift). */
export function formatFullDate(isoDateOnly: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDateOnly.trim());
  if (!m) return isoDateOnly;
  const y = Number(m[1]);
  const mon = Number(m[2]);
  const d = Number(m[3]);
  const local = new Date(y, mon - 1, d);
  return local.toLocaleDateString(undefined, { dateStyle: "long" });
}

/** Instant from DB (ISO string or Date). */
export function formatFullDateTime(value: Date | string): string {
  const dt = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dt.getTime())) return String(value);
  return dt.toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "medium",
  });
}

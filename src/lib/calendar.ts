// A weekly reminder as an .ics file the parent opens in their own calendar app. Built on the
// device, so the child's name never leaves it.

const pad = (n: number) => String(n).padStart(2, "0");

/** Local "floating" time: the event stays at 6 pm wherever the calendar is. */
function localStamp(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function utcStamp(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

/** Text values escape backslashes, commas, semicolons and newlines (RFC 5545 §3.3.11). */
function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\r?\n/g, "\\n");
}

/** Lines longer than 75 octets continue on the next line after a space. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  for (const ch of line) {
    const limit = parts.length === 0 ? 75 : 74;
    if (new TextEncoder().encode(current + ch).length > limit) {
      parts.push(current);
      current = ch;
    } else current += ch;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

/** The same weekday next week, at 6 pm. */
export function nextReminderStart(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 18, 0, 0);
}

type ReminderInput = {
  childName: string;
  /** Where the re-check starts, absolute. */
  url: string;
  start: Date;
  now: Date;
  /** How many weekly checks to add. */
  weeks?: number;
  uid: string;
};

export function weeklyReminderIcs({ childName, url, start, now, weeks = 4, uid }: ReminderInput): string {
  const who = childName.trim() || "your child";
  const end = new Date(start.getTime() + 15 * 60 * 1000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ReadBuddy//Weekly reading check//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}@readbuddy`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${localStamp(start)}`,
    `DTEND:${localStamp(end)}`,
    `RRULE:FREQ=WEEKLY;COUNT=${weeks}`,
    `SUMMARY:${escapeText(`Reading check for ${who}`)}`,
    `DESCRIPTION:${escapeText(`One minute of reading aloud with a new story. Start here: ${url}`)}`,
    `URL:${url}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(`Reading check for ${who}`)}`,
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

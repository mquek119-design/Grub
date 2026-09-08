/**
 * RFC 5545 compliant iCalendar (.ics) feed generator.
 * Produces live subscribeable calendar feeds for Apple Calendar, Google Calendar, and Outlook.
 */

export interface CalendarEvent {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  url?: string;
  start: Date;
  end: Date;
  alarmMinutesBefore?: number;
}

export interface CalendarFeedOptions {
  calendarName: string;
  description?: string;
  events: CalendarEvent[];
}

/**
 * Format a JavaScript Date to UTC iCalendar format: YYYYMMDDTHHMMSSZ
 */
export function formatIcsDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

/**
 * Escape special iCalendar characters in TEXT values according to RFC 5545.
 */
export function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Generate a complete RFC 5545 iCalendar (.ics) string.
 */
export function generateIcsFeed({
  calendarName,
  description,
  events,
}: CalendarFeedOptions): string {
  const now = formatIcsDate(new Date());

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Grub//Student Household Food//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    'X-WR-TIMEZONE:Europe/London',
  ];

  if (description) {
    lines.push(`X-WR-CALDESC:${escapeIcsText(description)}`);
  }

  for (const event of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.uid}`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART:${formatIcsDate(event.start)}`);
    lines.push(`DTEND:${formatIcsDate(event.end)}`);
    lines.push(`SUMMARY:${escapeIcsText(event.title)}`);

    if (event.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
    }

    if (event.location) {
      lines.push(`LOCATION:${escapeIcsText(event.location)}`);
    }

    if (event.url) {
      lines.push(`URL:${event.url}`);
    }

    if (event.alarmMinutesBefore && event.alarmMinutesBefore > 0) {
      lines.push('BEGIN:VALARM');
      lines.push(`TRIGGER:-PT${event.alarmMinutesBefore}M`);
      lines.push('ACTION:DISPLAY');
      lines.push(`DESCRIPTION:${escapeIcsText(event.title)}`);
      lines.push('END:VALARM');
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return lines.join('\r\n') + '\r\n';
}

import {
  formatIcsDate,
  escapeIcsText,
  generateIcsFeed,
  type CalendarEvent,
} from '../calendarGenerator';

describe('calendarGenerator', () => {
  describe('formatIcsDate', () => {
    it('formats dates in UTC YYYYMMDDTHHMMSSZ format', () => {
      const date = new Date('2026-09-08T18:30:00.000Z');
      expect(formatIcsDate(date)).toBe('20260908T183000Z');
    });
  });

  describe('escapeIcsText', () => {
    it('escapes semicolons, commas, backslashes, and newlines', () => {
      const text = 'Hello, World; this \\ that\nNew line';
      expect(escapeIcsText(text)).toBe('Hello\\, World\\; this \\\\ that\\nNew line');
    });
  });

  describe('generateIcsFeed', () => {
    it('generates a valid RFC 5545 iCalendar string with events and alarms', () => {
      const start = new Date('2026-09-08T18:30:00.000Z');
      const end = new Date('2026-09-08T19:15:00.000Z');

      const events: CalendarEvent[] = [
        {
          uid: 'meal-123',
          title: 'Spaghetti Bolognese',
          description: 'Cook: Alex, 5 diners',
          location: 'Flat 4B',
          url: 'https://grub.app/recipes/123?cook=true',
          start,
          end,
          alarmMinutesBefore: 60,
        },
      ];

      const ics = generateIcsFeed({
        calendarName: 'Grub · Flat 4B',
        description: 'House food schedule',
        events,
      });

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('VERSION:2.0');
      expect(ics).toContain('PRODID:-//Grub//Student Household Food//EN');
      expect(ics).toContain('X-WR-CALNAME:Grub · Flat 4B');
      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('UID:meal-123');
      expect(ics).toContain('DTSTART:20260908T183000Z');
      expect(ics).toContain('DTEND:20260908T191500Z');
      expect(ics).toContain('SUMMARY:Spaghetti Bolognese');
      expect(ics).toContain('DESCRIPTION:Cook: Alex\\, 5 diners');
      expect(ics).toContain('LOCATION:Flat 4B');
      expect(ics).toContain('URL:https://grub.app/recipes/123?cook=true');
      expect(ics).toContain('BEGIN:VALARM');
      expect(ics).toContain('TRIGGER:-PT60M');
      expect(ics).toContain('ACTION:DISPLAY');
      expect(ics).toContain('END:VALARM');
      expect(ics).toContain('END:VEVENT');
      expect(ics).toContain('END:VCALENDAR');
    });

    it('generates an event without alarm when alarmMinutesBefore is not provided', () => {
      const start = new Date('2026-09-08T12:00:00.000Z');
      const end = new Date('2026-09-08T12:30:00.000Z');

      const events: CalendarEvent[] = [
        {
          uid: 'simple-1',
          title: 'Simple Event',
          start,
          end,
        },
      ];

      const ics = generateIcsFeed({
        calendarName: 'Simple Cal',
        events,
      });

      expect(ics).toContain('SUMMARY:Simple Event');
      expect(ics).not.toContain('BEGIN:VALARM');
    });
  });
});

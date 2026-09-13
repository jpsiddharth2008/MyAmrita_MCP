import { Injectable } from '@nitrostack/core';

const CALENDAR_ICS_URL =
  'https://outlook.office365.com/owa/calendar/c5368a2f38a14425b7bfe0806e6a7242@amrita.edu/c90d8c3dd3654d4fa7af29ce6c6319907829757625615220928/calendar.ics';

export interface CalendarEvent {
  title: string;
  /** Inclusive, YYYY-MM-DD. */
  startDate: string;
  /** Inclusive, YYYY-MM-DD. */
  endDate: string;
}

/** Un-folds iCalendar's RFC 5545 line-folding (continuation lines start with a space/tab). */
function unfoldIcsLines(ics: string): string[] {
  const rawLines = ics.split(/\r\n|\n|\r/);
  const lines: string[] = [];

  for (const line of rawLines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }

  return lines;
}

function unescapeIcsText(text: string): string {
  return text
    .replace(/\\n/gi, ' ')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}

/** "20260613" -> "2026-06-13". Every event in this feed has been observed as an all-day VALUE=DATE event. */
function parseIcsDate(value: string): string {
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class CalendarService {
  async getEvents(): Promise<CalendarEvent[]> {
    const res = await fetch(CALENDAR_ICS_URL);
    if (!res.ok) {
      throw new Error(`Failed to fetch the academic calendar feed (HTTP ${res.status}).`);
    }

    const lines = unfoldIcsLines(await res.text());
    const events: CalendarEvent[] = [];
    let current: { summary?: string; dtstart?: string; dtend?: string } | null = null;

    for (const line of lines) {
      if (line === 'BEGIN:VEVENT') {
        current = {};
      } else if (line === 'END:VEVENT') {
        if (current?.summary && current.dtstart) {
          const startDate = parseIcsDate(current.dtstart);
          // DTEND is exclusive per RFC 5545; step back a day for an intuitive inclusive end date.
          const endDate = current.dtend ? addDaysIso(parseIcsDate(current.dtend), -1) : startDate;
          events.push({ title: unescapeIcsText(current.summary), startDate, endDate });
        }
        current = null;
      } else if (current) {
        if (line.startsWith('SUMMARY:')) {
          current.summary = line.slice('SUMMARY:'.length);
        } else if (line.startsWith('DTSTART;VALUE=DATE:')) {
          current.dtstart = line.slice('DTSTART;VALUE=DATE:'.length);
        } else if (line.startsWith('DTEND;VALUE=DATE:')) {
          current.dtend = line.slice('DTEND;VALUE=DATE:'.length);
        }
      }
    }

    events.sort((a, b) => a.startDate.localeCompare(b.startDate));
    return events;
  }
}

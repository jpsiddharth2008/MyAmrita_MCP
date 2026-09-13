import { Injectable } from '@nitrostack/core';
import { PortalHttpClient } from '../../common/portal-http-client.js';
import { parseDataRows, splitCellLines } from '../../common/html-table-parser.js';

const TIMETABLE_URL = 'https://students.amrita.edu/client/timetable';

export interface TimetablePeriod {
  period: number;
  /** Lines of text for this period slot (course code/name/room, however the portal packs it), or null if free. */
  lines: string[] | null;
}

export interface TimetableDay {
  day: string;
  periods: TimetablePeriod[];
}

@Injectable({ deps: [PortalHttpClient] })
export class TimetableService {
  constructor(private readonly http: PortalHttpClient) {}

  async getTimetable(): Promise<TimetableDay[]> {
    const $ = await this.http.fetchPage(TIMETABLE_URL);

    return parseDataRows($, 'table.equal-width-th tr', 2, (cells) => {
      const day = cells[0].text().trim();
      const periods: TimetablePeriod[] = [];
      for (let p = 1; p < cells.length; p++) {
        const lines = splitCellLines(cells[p].html() ?? '');
        periods.push({ period: p, lines: lines.length > 0 ? lines : null });
      }
      return { day, periods };
    });
  }

  /** Returns the schedule for a specific date's weekday (defaults to today). */
  async getClassesForDate(isoDate?: string): Promise<{ date: string; day: string; periods: TimetablePeriod[] }> {
    const targetDate = isoDate ? new Date(isoDate) : new Date();
    if (Number.isNaN(targetDate.getTime())) {
      throw new Error(`Invalid date: "${isoDate}". Use an ISO date string like "2026-09-15".`);
    }

    const weekday = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
    const days = await this.getTimetable();
    const match = days.find((d) => d.day.toLowerCase() === weekday.toLowerCase());

    return {
      date: targetDate.toISOString().slice(0, 10),
      day: weekday,
      periods: match?.periods.filter((p) => p.lines !== null) ?? [],
    };
  }
}

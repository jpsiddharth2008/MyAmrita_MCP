import { Injectable } from '@nitrostack/core';
import * as cheerio from 'cheerio';
import { SessionService } from '../auth/session.service.js';
import { PortalSessionExpiredError } from '../../common/errors.js';

const TIMETABLE_URL = 'https://students.amrita.edu/client/timetable';
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export interface TimetablePeriod {
  period: number;
  /** Lines of text for this period slot (course code/name/room, however the portal packs it), or null if free. */
  lines: string[] | null;
}

export interface TimetableDay {
  day: string;
  periods: TimetablePeriod[];
}

/** Decodes HTML entities (e.g. &nbsp;) in a fragment by round-tripping it through cheerio's text extraction. */
function decodeHtmlText(html: string): string {
  return cheerio.load(`<div>${html}</div>`)('div').text();
}

/** Splits a table cell's inner HTML on <br> tags into trimmed, non-empty, entity-decoded text lines. */
function splitByBr(cellHtml: string): string[] {
  return cellHtml
    .split(/<br\s*\/?>/i)
    .map((part) => decodeHtmlText(part).trim())
    .filter((part) => part.length > 0);
}

@Injectable({ deps: [SessionService] })
export class TimetableService {
  constructor(private readonly session: SessionService) {}

  async getTimetable(): Promise<TimetableDay[]> {
    if (!this.session.isAuthenticated()) {
      throw new PortalSessionExpiredError();
    }

    const res = await fetch(TIMETABLE_URL, {
      redirect: 'manual',
      headers: {
        Cookie: this.session.cookieHeaderFor('students.amrita.edu'),
        'User-Agent': BROWSER_UA,
      },
    });

    if (res.status !== 200) {
      throw new PortalSessionExpiredError();
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const days: TimetableDay[] = [];

    $('table.equal-width-th tr').each((i, el) => {
      if (i === 0) return; // header row (period numbers)

      const cells = $(el).find('th, td');
      if (cells.length < 2) return;

      const day = $(cells[0]).text().trim();
      const periods: TimetablePeriod[] = [];
      for (let p = 1; p < cells.length; p++) {
        const lines = splitByBr($(cells[p]).html() ?? '');
        periods.push({ period: p, lines: lines.length > 0 ? lines : null });
      }
      days.push({ day, periods });
    });

    return days;
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

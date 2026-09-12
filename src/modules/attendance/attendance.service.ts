import { Injectable } from '@nitrostack/core';
import * as cheerio from 'cheerio';
import { SessionService } from '../auth/session.service.js';

const ATTENDANCE_URL = 'https://students.amrita.edu/client/class-attendance';
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export interface AttendanceRow {
  slNo: number;
  className: string;
  courseCode: string;
  courseName: string;
  faculty: string[];
  total: number;
  present: number;
  dutyLeave: number;
  absent: number;
  percentage: number;
  medical: number;
}

/** Splits a table cell's inner HTML on <br> tags into trimmed, non-empty text lines. */
function splitByBr(cellHtml: string): string[] {
  return cellHtml
    .split(/<br\s*\/?>/i)
    .map((part) => part.replace(/<[^>]+>/g, '').trim())
    .filter((part) => part.length > 0);
}

@Injectable()
export class AttendanceService {
  constructor(private readonly session: SessionService) {}

  async getAttendance(academicTermId?: string): Promise<AttendanceRow[]> {
    if (!this.session.isAuthenticated()) {
      throw new Error('Not logged in to the Amrita student portal. Run the auth_login tool first.');
    }

    const url = academicTermId
      ? `${ATTENDANCE_URL}?academic_term_id=${encodeURIComponent(academicTermId)}`
      : ATTENDANCE_URL;

    const res = await fetch(url, {
      redirect: 'manual',
      headers: {
        Cookie: this.session.cookieHeaderFor('students.amrita.edu'),
        'User-Agent': BROWSER_UA,
      },
    });

    if (res.status !== 200) {
      throw new Error(
        'Amrita portal session appears to have expired. Run the auth_login tool to sign in again.'
      );
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const rows: AttendanceRow[] = [];

    $('table#home_tab tr').each((i, el) => {
      if (i === 0) return; // header row

      const cells = $(el).find('th, td');
      if (cells.length < 10) return;

      const courseLines = splitByBr($(cells[2]).html() ?? '');
      const faculty = splitByBr($(cells[3]).html() ?? '');

      rows.push({
        slNo: Number($(cells[0]).text().trim()),
        className: $(cells[1]).text().trim(),
        courseCode: courseLines[0] ?? '',
        courseName: courseLines[1] ?? '',
        faculty,
        total: Number($(cells[4]).text().trim()),
        present: Number($(cells[5]).text().trim()),
        dutyLeave: Number($(cells[6]).text().trim()),
        absent: Number($(cells[7]).text().trim()),
        percentage: Number($(cells[8]).text().trim()),
        medical: Number($(cells[9]).text().trim()),
      });
    });

    return rows;
  }
}

import { Injectable } from '@nitrostack/core';
import * as cheerio from 'cheerio';
import { SessionService } from '../auth/session.service.js';
import { parseSelectedAcademicTerm, type AcademicTerm } from '../../common/academic-term.js';

const MARKS_URL = 'https://students.amrita.edu/client/mark';
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export interface MarkEntry {
  courseName: string;
  courseCode: string;
  marksObtained: number;
  maxMarks: number;
  componentName: string;
  examName: string;
}

@Injectable({ deps: [SessionService] })
export class MarksService {
  constructor(private readonly session: SessionService) {}

  async getMarks(academicTermId?: string): Promise<{ term: AcademicTerm | null; marks: MarkEntry[] }> {
    if (!this.session.isAuthenticated()) {
      throw new Error('Not logged in to the Amrita student portal. Run the auth_login tool first.');
    }

    const url = academicTermId
      ? `${MARKS_URL}?academic_term_id=${encodeURIComponent(academicTermId)}`
      : MARKS_URL;

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
    const term = parseSelectedAcademicTerm($);
    const marks: MarkEntry[] = [];

    $('table tbody tr').each((_, el) => {
      const cells = $(el).find('td');
      if (cells.length < 6) return;

      marks.push({
        courseName: $(cells[0]).text().trim(),
        courseCode: $(cells[1]).text().trim(),
        marksObtained: Number($(cells[2]).text().trim()),
        maxMarks: Number($(cells[3]).text().trim()),
        componentName: $(cells[4]).text().trim(),
        examName: $(cells[5]).text().trim(),
      });
    });

    return { term, marks };
  }
}

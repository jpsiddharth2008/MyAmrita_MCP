import { Injectable } from '@nitrostack/core';
import { PortalHttpClient } from '../../common/portal-http-client.js';
import { parseSelectedAcademicTerm, type AcademicTerm } from '../../common/academic-term.js';
import { parseDataRows } from '../../common/html-table-parser.js';

const MARKS_URL = 'https://students.amrita.edu/client/mark';

export interface MarkEntry {
  courseName: string;
  courseCode: string;
  marksObtained: number;
  maxMarks: number;
  componentName: string;
  examName: string;
}

@Injectable({ deps: [PortalHttpClient] })
export class MarksService {
  constructor(private readonly http: PortalHttpClient) {}

  async getMarks(academicTermId?: string): Promise<{ term: AcademicTerm | null; marks: MarkEntry[] }> {
    const url = academicTermId
      ? `${MARKS_URL}?academic_term_id=${encodeURIComponent(academicTermId)}`
      : MARKS_URL;

    const $ = await this.http.fetchPage(url);
    const term = parseSelectedAcademicTerm($);

    // This table has a proper <thead>, so "tbody tr" already excludes the header row.
    const marks = parseDataRows(
      $,
      'table tbody tr',
      6,
      (cells) => ({
        courseName: cells[0].text().trim(),
        courseCode: cells[1].text().trim(),
        marksObtained: Number(cells[2].text().trim()),
        maxMarks: Number(cells[3].text().trim()),
        componentName: cells[4].text().trim(),
        examName: cells[5].text().trim(),
      }),
      { skipFirstRow: false }
    );

    return { term, marks };
  }
}

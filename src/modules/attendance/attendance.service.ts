import { Injectable } from '@nitrostack/core';
import { PortalHttpClient } from '../../common/portal-http-client.js';
import { parseSelectedAcademicTerm, type AcademicTerm } from '../../common/academic-term.js';
import { parseDataRows, splitCellLines } from '../../common/html-table-parser.js';

const ATTENDANCE_URL = 'https://students.amrita.edu/client/class-attendance';

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

@Injectable({ deps: [PortalHttpClient] })
export class AttendanceService {
  constructor(private readonly http: PortalHttpClient) {}

  async getAttendance(academicTermId?: string): Promise<{ term: AcademicTerm | null; subjects: AttendanceRow[] }> {
    const url = academicTermId
      ? `${ATTENDANCE_URL}?academic_term_id=${encodeURIComponent(academicTermId)}`
      : ATTENDANCE_URL;

    const $ = await this.http.fetchPage(url);
    const term = parseSelectedAcademicTerm($);

    const subjects = parseDataRows($, 'table#home_tab tr', 10, (cells) => {
      const courseLines = splitCellLines(cells[2].html() ?? '');
      const faculty = splitCellLines(cells[3].html() ?? '');

      return {
        slNo: Number(cells[0].text().trim()),
        className: cells[1].text().trim(),
        courseCode: courseLines[0] ?? '',
        courseName: courseLines[1] ?? '',
        faculty,
        total: Number(cells[4].text().trim()),
        present: Number(cells[5].text().trim()),
        dutyLeave: Number(cells[6].text().trim()),
        absent: Number(cells[7].text().trim()),
        percentage: Number(cells[8].text().trim()),
        medical: Number(cells[9].text().trim()),
      };
    });

    return { term, subjects };
  }
}

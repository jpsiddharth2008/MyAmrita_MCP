import {
  ToolDecorator as Tool,
  ControllerDecorator as Controller,
  Injectable,
  ExecutionContext,
  z,
} from '@nitrostack/core';
import { AttendanceService } from './attendance.service.js';

@Controller('attendance')
@Injectable({ deps: [AttendanceService] })
export class AttendanceTools {
  constructor(private readonly attendance: AttendanceService) {}

  @Tool({
    name: 'get_attendance',
    description:
      'Get the full per-subject class attendance report from the Amrita student portal, including total ' +
      'classes, present, absent, duty leave, and attendance percentage for each subject. The response includes ' +
      'which academic term this data is for (term.label) — the portal\'s default term is not always the ' +
      'latest calendar semester, so always check this field rather than assuming the data is "current". ' +
      'Requires an active login session (see auth_login).',
    inputSchema: z.object({
      academicTermId: z
        .string()
        .optional()
        .describe('Optional academic term id to view a past term instead of the portal\'s default term.'),
    }),
  })
  async getAttendance(input: { academicTermId?: string }, ctx: ExecutionContext) {
    const { term, subjects } = await this.attendance.getAttendance(input.academicTermId);
    ctx.logger.info('Fetched attendance', { term: term?.label, subjectCount: subjects.length });

    const totalClasses = subjects.reduce((sum, s) => sum + s.total, 0);
    const totalPresent = subjects.reduce((sum, s) => sum + s.present, 0);
    const overallPercentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 10000) / 100 : 0;

    return {
      term,
      subjects,
      summary: {
        totalClasses,
        totalPresent,
        overallPercentage,
      },
    };
  }

  @Tool({
    name: 'get_low_attendance_subjects',
    description:
      'Get the subset of subjects where attendance percentage is below a given threshold (default 75%). ' +
      'The response includes which academic term this data is for (term.label) — check this rather than ' +
      'assuming it\'s the current semester. Requires an active login session (see auth_login).',
    inputSchema: z.object({
      threshold: z.number().min(0).max(100).default(75).describe('Attendance percentage threshold.'),
      academicTermId: z
        .string()
        .optional()
        .describe('Optional academic term id to check a past term instead of the portal\'s default term.'),
    }),
  })
  async getLowAttendanceSubjects(input: { threshold: number; academicTermId?: string }, ctx: ExecutionContext) {
    const { term, subjects } = await this.attendance.getAttendance(input.academicTermId);
    const belowThreshold = subjects.filter((s) => s.percentage < input.threshold);
    ctx.logger.info('Checked low attendance subjects', {
      term: term?.label,
      threshold: input.threshold,
      matchCount: belowThreshold.length,
    });

    return {
      term,
      threshold: input.threshold,
      subjects: belowThreshold,
    };
  }
}

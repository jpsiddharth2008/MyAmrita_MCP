import {
  ToolDecorator as Tool,
  ControllerDecorator as Controller,
  Injectable,
  ExecutionContext,
  z,
} from '@nitrostack/core';
import { TimetableService } from './timetable.service.js';

@Controller('timetable')
@Injectable({ deps: [TimetableService] })
export class TimetableTools {
  constructor(private readonly timetable: TimetableService) {}

  @Tool({
    name: 'get_timetable',
    description:
      'Get the full weekly class timetable (all days, all periods) from the Amrita student portal. ' +
      'Requires an active login session (see auth_login).',
    inputSchema: z.object({}),
  })
  async getTimetable(_input: {}, ctx: ExecutionContext) {
    const days = await this.timetable.getTimetable();
    ctx.logger.info('Fetched timetable', { dayCount: days.length });
    return { days };
  }

  @Tool({
    name: 'get_classes_for_date',
    description:
      'Get the classes scheduled for a specific date (defaults to today if no date is given), based on that ' +
      "date's weekday in the weekly timetable. Use this for questions like \"what classes do I have today/" +
      'tomorrow/on Thursday\". Requires an active login session (see auth_login).',
    inputSchema: z.object({
      date: z
        .string()
        .optional()
        .describe('ISO date string, e.g. "2026-09-15". Defaults to today if omitted.'),
    }),
  })
  async getClassesForDate(input: { date?: string }, ctx: ExecutionContext) {
    const result = await this.timetable.getClassesForDate(input.date);
    ctx.logger.info('Fetched classes for date', { date: result.date, day: result.day, count: result.periods.length });
    return result;
  }
}

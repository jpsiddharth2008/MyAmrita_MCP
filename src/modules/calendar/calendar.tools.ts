import {
  ToolDecorator as Tool,
  ControllerDecorator as Controller,
  Injectable,
  Cache,
  ExecutionContext,
  z,
} from '@nitrostack/core';
import { CalendarService } from './calendar.service.js';

@Controller('calendar')
@Injectable({ deps: [CalendarService] })
export class CalendarTools {
  constructor(private readonly calendar: CalendarService) {}

  @Tool({
    name: 'get_academic_calendar',
    description:
      'Get the full Amrita academic calendar for the current academic year: holidays, semester commencement ' +
      'dates, exam periods, day-order changes, etc. Each entry has a title and an inclusive date range. This ' +
      'is a public institutional calendar — no login required.',
    inputSchema: z.object({}),
  })
  @Cache({ ttl: 3600 })
  async getAcademicCalendar(_input: {}, ctx: ExecutionContext) {
    const events = await this.calendar.getEvents();
    ctx.logger.info('Fetched academic calendar', { count: events.length });
    return { events };
  }

  @Tool({
    name: 'get_upcoming_events',
    description:
      'Get academic calendar events (holidays, exam periods, commencement dates, etc.) occurring from today ' +
      'onward, within a given number of days (default 30). Use this for questions like "what tests do I have ' +
      'this week" or "when is my next exam" — read the titles to identify exam-related entries. No login ' +
      'required.',
    inputSchema: z.object({
      days: z.number().min(1).max(365).default(30).describe('How many days ahead of today to include.'),
    }),
  })
  @Cache({ ttl: 3600 })
  async getUpcomingEvents(input: { days: number }, ctx: ExecutionContext) {
    const events = await this.calendar.getEvents();
    const today = new Date().toISOString().slice(0, 10);
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + input.days);
    const horizonStr = horizon.toISOString().slice(0, 10);

    const upcoming = events.filter((e) => e.endDate >= today && e.startDate <= horizonStr);
    ctx.logger.info('Fetched upcoming events', { days: input.days, count: upcoming.length });

    return { from: today, to: horizonStr, events: upcoming };
  }
}

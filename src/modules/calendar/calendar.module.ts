import { Module } from '@nitrostack/core';
import { CalendarService } from './calendar.service.js';
import { CalendarTools } from './calendar.tools.js';

@Module({
  name: 'calendar',
  description:
    'Reads the Amrita academic calendar from a published Outlook calendar feed (holidays, exam periods, ' +
    'commencement dates) — a public data source, no portal login required',
  providers: [CalendarService],
  controllers: [CalendarTools],
})
export class CalendarModule {}

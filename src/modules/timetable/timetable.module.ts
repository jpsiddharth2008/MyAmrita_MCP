import { Module } from '@nitrostack/core';
import { AuthModule } from '../auth/auth.module.js';
import { TimetableService } from './timetable.service.js';
import { TimetableTools } from './timetable.tools.js';

@Module({
  name: 'timetable',
  description: 'Reads class timetable data from the Amrita student portal',
  imports: [AuthModule],
  providers: [TimetableService],
  controllers: [TimetableTools],
})
export class TimetableModule {}

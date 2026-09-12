import { Module } from '@nitrostack/core';
import { AuthModule } from '../auth/auth.module.js';
import { AttendanceService } from './attendance.service.js';
import { AttendanceTools } from './attendance.tools.js';

@Module({
  name: 'attendance',
  description: 'Reads class attendance data from the Amrita student portal',
  imports: [AuthModule],
  providers: [AttendanceService],
  controllers: [AttendanceTools],
})
export class AttendanceModule {}

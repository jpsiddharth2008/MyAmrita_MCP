import { McpApp, Module, ConfigModule } from '@nitrostack/core';
import { AuthModule } from './modules/auth/auth.module.js';
import { AttendanceModule } from './modules/attendance/attendance.module.js';
import { TimetableModule } from './modules/timetable/timetable.module.js';
import { MarksModule } from './modules/marks/marks.module.js';
import { LeaveModule } from './modules/leave/leave.module.js';
import { GatePassModule } from './modules/gatepass/gatepass.module.js';
import { CalendarModule } from './modules/calendar/calendar.module.js';
import { SystemHealthCheck } from './health/system.health.js';

/**
 * Root Application Module
 *
 * This is the main module that bootstraps the MCP server.
 * It registers all feature modules and health checks.
 */
@McpApp({
  module: AppModule,
  server: {
    name: 'amrita-ai-assistant',
    version: '1.0.0'
  },
  logging: {
    level: 'info'
  }
})
@Module({
  name: 'app',
  description: 'Root application module',
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    AttendanceModule,
    TimetableModule,
    MarksModule,
    LeaveModule,
    GatePassModule,
    CalendarModule
  ],
  providers: [
    // Health Checks
    SystemHealthCheck,
  ]
})
export class AppModule {}


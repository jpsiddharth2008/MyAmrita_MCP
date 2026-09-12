import { McpApp, Module, ConfigModule } from '@nitrostack/core';
import { AuthModule } from './modules/auth/auth.module.js';
import { AttendanceModule } from './modules/attendance/attendance.module.js';
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
    AttendanceModule
  ],
  providers: [
    // Health Checks
    SystemHealthCheck,
  ]
})
export class AppModule {}


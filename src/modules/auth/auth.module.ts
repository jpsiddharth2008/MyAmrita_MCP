import { Module } from '@nitrostack/core';
import { SessionService } from './session.service.js';
import { AuthTools } from './auth.tools.js';

@Module({
  name: 'auth',
  description: 'Authenticates with the Amrita student portal via Microsoft SSO and persists the resulting session',
  providers: [SessionService],
  controllers: [AuthTools],
  exports: [SessionService],
})
export class AuthModule {}

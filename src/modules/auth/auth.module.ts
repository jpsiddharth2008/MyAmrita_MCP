import { Module } from '@nitrostack/core';
import { SessionService } from './session.service.js';
import { AuthTools } from './auth.tools.js';
import { PortalHttpClient } from '../../common/portal-http-client.js';

@Module({
  name: 'auth',
  description: 'Authenticates with the Amrita student portal via Microsoft SSO and persists the resulting session',
  providers: [SessionService, PortalHttpClient],
  controllers: [AuthTools],
  exports: [SessionService, PortalHttpClient],
})
export class AuthModule {}

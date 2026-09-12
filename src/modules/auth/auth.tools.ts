import {
  ToolDecorator as Tool,
  ControllerDecorator as Controller,
  Injectable,
  ExecutionContext,
  z,
} from '@nitrostack/core';
import { SessionService } from './session.service.js';

@Controller('auth')
@Injectable({ deps: [SessionService] })
export class AuthTools {
  constructor(private readonly session: SessionService) {}

  @Tool({
    name: 'status',
    description: 'Check whether there is currently a valid, active session with the Amrita student portal.',
    inputSchema: z.object({}),
  })
  async status(_input: {}, ctx: ExecutionContext) {
    const authenticated = this.session.isAuthenticated();
    ctx.logger.info('Checked Amrita portal session status', { authenticated });
    return { authenticated };
  }

  @Tool({
    name: 'login',
    description:
      'Log in to the Amrita student portal via Microsoft SSO. Requires the user to have already opened a ' +
      'browser themselves with remote debugging enabled (this tool will return the exact command to run if ' +
      'none is found) — this tool then connects to that browser, navigates it to the login page, and blocks ' +
      'until the user finishes signing in themselves (or times out after 5 minutes). Only call this after the ' +
      'user has explicitly asked to log in or re-authenticate. Once logged in, the session is reused ' +
      'automatically by every other tool until it expires.',
    inputSchema: z.object({}),
  })
  async login(_input: {}, ctx: ExecutionContext) {
    ctx.logger.info('Starting interactive Amrita SSO login');
    await this.session.interactiveLogin();
    return { authenticated: this.session.isAuthenticated() };
  }

  @Tool({
    name: 'logout',
    description: 'Clear the locally stored Amrita portal session.',
    inputSchema: z.object({}),
  })
  async logout(_input: {}, ctx: ExecutionContext) {
    await this.session.clearSession();
    ctx.logger.info('Cleared local Amrita portal session');
    return { authenticated: false };
  }
}

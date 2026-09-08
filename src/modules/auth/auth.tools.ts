import { ToolDecorator as Tool, ControllerDecorator as Controller, ExecutionContext, z } from '@nitrostack/core';
import { SessionService } from './session.service.js';

@Controller('auth')
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
      'Open a real browser window for the user to log in to the Amrita student portal via Microsoft SSO. ' +
      'Only call this after the user has explicitly asked to log in or re-authenticate — it opens a visible ' +
      'browser window and blocks until the user finishes signing in themselves (or times out after 5 minutes). ' +
      'Once logged in, the session is reused automatically by every other tool until it expires.',
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

import { Injectable, type ExceptionFilterInterface, type ExecutionContext } from '@nitrostack/core';
import { PortalSessionExpiredError } from './errors.js';

/**
 * Turns a PortalSessionExpiredError into a clear, consistent tool response
 * instead of a raw error, so the AI/user gets an unambiguous "log in again"
 * signal rather than a confusing HTTP/parsing failure. Any other error is
 * re-thrown untouched, falling through to the framework's default error
 * handling.
 */
@Injectable()
export class SessionExpiredFilter implements ExceptionFilterInterface {
  catch(exception: unknown, context: ExecutionContext) {
    if (exception instanceof PortalSessionExpiredError) {
      context.logger.warn('Amrita portal session expired mid-call', { tool: context.toolName });
      return {
        error: 'session_expired',
        message: exception.message,
      };
    }

    throw exception;
  }
}

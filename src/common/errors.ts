/**
 * Thrown by data services when the Amrita portal session is missing or has
 * expired mid-call (the portal redirected back to the SSO gate instead of
 * serving the requested page). Caught by SessionExpiredFilter and turned into
 * a consistent { error: 'session_expired', message } response instead of a
 * raw/confusing error.
 */
export class PortalSessionExpiredError extends Error {
  constructor(
    message = 'Amrita portal session is missing or has expired. Run the auth_login tool to sign in again.'
  ) {
    super(message);
    this.name = 'PortalSessionExpiredError';
  }
}

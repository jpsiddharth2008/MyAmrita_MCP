import { Injectable } from '@nitrostack/core';
import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import { SessionService } from '../modules/auth/session.service.js';
import { PortalSessionExpiredError } from './errors.js';

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/**
 * Shared authenticated-fetch logic for talking to students.amrita.edu. Every
 * data module needs the same "check session, attach cookie, verify the
 * portal didn't just redirect us back to the SSO gate" dance — this
 * centralizes it so a change to that behavior (e.g. issue #9's
 * PortalSessionExpiredError) only has to be made once.
 */
@Injectable({ deps: [SessionService] })
export class PortalHttpClient {
  constructor(private readonly session: SessionService) {}

  /** GETs a portal page and returns it loaded into cheerio. A live session serves the page directly (200); anything else means we got bounced back through the SSO gate. */
  async fetchPage(url: string): Promise<CheerioAPI> {
    const res = await this.request(url, {}, [200]);
    return cheerio.load(await res.text());
  }

  /** POSTs a multipart form to the portal (e.g. submitting the gate pass form). A successful POST redirects back to the same page (302), or may render it directly (200). */
  async postForm(url: string, form: FormData): Promise<Response> {
    return this.request(url, { method: 'POST', body: form }, [200, 302]);
  }

  private async request(url: string, init: RequestInit, acceptableStatuses: number[]): Promise<Response> {
    if (!this.session.isAuthenticated()) {
      throw new PortalSessionExpiredError();
    }

    const res = await fetch(url, {
      ...init,
      redirect: 'manual',
      headers: {
        Cookie: this.session.cookieHeaderFor('students.amrita.edu'),
        'User-Agent': BROWSER_UA,
      },
    });

    if (!acceptableStatuses.includes(res.status)) {
      throw new PortalSessionExpiredError();
    }

    return res;
  }
}

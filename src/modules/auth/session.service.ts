import { Injectable, OnModuleInit, ConfigService } from '@nitrostack/core';
import { chromium } from 'playwright';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const SESSION_FILE = path.resolve(process.cwd(), '.amrita-session.enc');
const PORTAL_HOME = 'https://students.amrita.edu/client/index';
const SSO_GATE = 'https://my.amrita.edu';
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

interface StoredCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
}

/**
 * Holds the Amrita student portal session (Microsoft SSO-backed) for the whole app.
 * Auth is federated through Microsoft Entra ID, so there is no username/password
 * form we can POST to directly — the user must complete the SSO login once in a
 * real browser window. The resulting cookies are persisted (encrypted) so every
 * later tool call can reuse them until the portal session itself expires.
 */
@Injectable({ deps: [ConfigService] })
export class SessionService implements OnModuleInit {
  private cookies: StoredCookie[] = [];
  private authenticated = false;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    await this.loadPersistedSession();
    if (this.cookies.length > 0) {
      this.authenticated = await this.verifySession();
    }
  }

  isAuthenticated(): boolean {
    return this.authenticated;
  }

  /** Cookie header for a given target host, applying standard cookie domain-matching rules. */
  cookieHeaderFor(hostname: string): string {
    return this.cookies
      .filter((c) => this.domainMatches(c.domain, hostname))
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');
  }

  private domainMatches(cookieDomain: string, hostname: string): boolean {
    const normalized = cookieDomain.startsWith('.') ? cookieDomain.slice(1) : cookieDomain;
    return hostname === normalized || hostname.endsWith(`.${normalized}`);
  }

  /** Ensures there is a live session, re-verifying with the portal first before falling back to interactive login. */
  async ensureAuthenticated(): Promise<void> {
    if (this.authenticated && (await this.verifySession())) return;
    await this.interactiveLogin();
  }

  private async verifySession(): Promise<boolean> {
    if (this.cookies.length === 0) return false;
    try {
      const res = await fetch(PORTAL_HOME, {
        redirect: 'manual',
        headers: {
          Cookie: this.cookieHeaderFor('students.amrita.edu'),
          'User-Agent': BROWSER_UA,
        },
      });
      // A live session serves the dashboard directly (200). An expired one
      // redirects back through the SSO gate (30x).
      return res.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Opens a real, visible browser window and waits for the user to complete
   * Microsoft SSO login themselves. This code never sees or handles the user's
   * credentials — it only captures the resulting session cookies afterward.
   */
  async interactiveLogin(): Promise<void> {
    // Uses the system's installed Microsoft Edge (Chromium-based) rather than
    // Playwright's own downloaded/unsigned Chromium binary — a properly signed,
    // already-trusted browser is far less likely to get killed mid-launch by
    // antivirus/Defender heuristics.
    const browser = await chromium.launch({ headless: false, channel: 'msedge' });
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(SSO_GATE);

      // Wait for the SSO round-trip to land back on the authenticated dashboard.
      await page.waitForURL('**/client/index**', { timeout: 5 * 60 * 1000 });

      const rawCookies = await context.cookies();
      this.cookies = rawCookies
        .filter((c) => c.domain.includes('amrita.edu'))
        .map((c) => ({ name: c.name, value: c.value, domain: c.domain, path: c.path }));

      this.authenticated = this.cookies.length > 0;
      await this.persistSession();
    } finally {
      await browser.close();
    }
  }

  async clearSession(): Promise<void> {
    this.cookies = [];
    this.authenticated = false;
    await fs.rm(SESSION_FILE, { force: true });
  }

  private async persistSession(): Promise<void> {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const payload = Buffer.concat([cipher.update(JSON.stringify(this.cookies), 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    await fs.writeFile(SESSION_FILE, Buffer.concat([iv, authTag, payload]));
  }

  private async loadPersistedSession(): Promise<void> {
    try {
      const blob = await fs.readFile(SESSION_FILE);
      const key = this.getEncryptionKey();
      const iv = blob.subarray(0, 12);
      const authTag = blob.subarray(12, 28);
      const payload = blob.subarray(28);
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([decipher.update(payload), decipher.final()]);
      this.cookies = JSON.parse(decrypted.toString('utf8'));
    } catch {
      this.cookies = [];
    }
  }

  private getEncryptionKey(): Buffer {
    const secret = this.config.get('SESSION_ENCRYPTION_KEY');
    if (!secret) {
      throw new Error(
        'SESSION_ENCRYPTION_KEY is not set. Add a long random value to .env before logging in (see .env.example).'
      );
    }
    return crypto.createHash('sha256').update(secret).digest();
  }
}

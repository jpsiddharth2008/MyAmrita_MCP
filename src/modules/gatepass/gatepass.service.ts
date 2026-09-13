import { Injectable } from '@nitrostack/core';
import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import { SessionService } from '../auth/session.service.js';
import { PortalSessionExpiredError } from '../../common/errors.js';

const HOSTEL_URL = 'https://students.amrita.edu/hostel/index';
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export interface GatePassEntry {
  id: string;
  passName: string;
  from: string;
  to: string;
  levelStatus: string;
  finalStatus: string;
  createdOn: string;
}

export type PassType = 'home' | 'out';

export interface GatePassRequest {
  passType: PassType;
  reason: string;
  fromDate: string;
  fromTime: string;
  toDate: string;
  toTime: string;
}

@Injectable({ deps: [SessionService] })
export class GatePassService {
  constructor(private readonly session: SessionService) {}

  private async fetchHostelPage(): Promise<CheerioAPI> {
    if (!this.session.isAuthenticated()) {
      throw new PortalSessionExpiredError();
    }

    const res = await fetch(HOSTEL_URL, {
      redirect: 'manual',
      headers: {
        Cookie: this.session.cookieHeaderFor('students.amrita.edu'),
        'User-Agent': BROWSER_UA,
      },
    });

    if (res.status !== 200) {
      throw new PortalSessionExpiredError();
    }

    return cheerio.load(await res.text());
  }

  private parseGatePasses($: CheerioAPI): GatePassEntry[] {
    const entries: GatePassEntry[] = [];

    $('table#home_tab tr').each((i, el) => {
      if (i === 0) return; // header row

      const cells = $(el).find('th, td');
      if (cells.length < 7) return;

      entries.push({
        id: $(cells[0]).text().trim(),
        passName: $(cells[1]).text().trim(),
        from: $(cells[2]).text().trim(),
        to: $(cells[3]).text().trim(),
        levelStatus: $(cells[4]).text().trim(),
        finalStatus: $(cells[5]).text().trim(),
        createdOn: $(cells[6]).text().trim(),
      });
    });

    return entries;
  }

  async getGatePasses(): Promise<GatePassEntry[]> {
    const $ = await this.fetchHostelPage();
    return this.parseGatePasses($);
  }

  /**
   * Submits a new gate pass request. Only ever called after the caller (a
   * tool method) has already gated this behind an explicit confirm:true —
   * this method itself always submits immediately, it does not know about
   * dry-run semantics.
   */
  async submitGatePass(request: GatePassRequest): Promise<GatePassEntry[]> {
    const $ = await this.fetchHostelPage();
    const token = $('#home_add_div input[name="token"]').attr('value');
    if (!token) {
      throw new Error(
        'Could not find the gate pass form\'s security token on the portal page — its structure may have changed.'
      );
    }

    const form = new FormData();
    form.set('token', token);
    form.set('pass_id', request.passType === 'home' ? '1' : '2');
    form.set('pass_remarks', request.reason);
    form.set('pass_date_from', request.fromDate);
    form.set('pass_time_from', request.fromTime);
    form.set('pass_date_to', request.toDate);
    form.set('pass_time_to', request.toTime);
    form.set('student_gate_pass_add', 'Save');

    const res = await fetch(HOSTEL_URL, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        Cookie: this.session.cookieHeaderFor('students.amrita.edu'),
        'User-Agent': BROWSER_UA,
      },
      body: form,
    });

    if (res.status !== 200 && res.status !== 302) {
      throw new Error(`Gate pass submission returned an unexpected status (${res.status}).`);
    }

    // Best-effort confirmation: re-fetch the list so the caller can see whether the new entry appeared.
    return this.getGatePasses();
  }
}

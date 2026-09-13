import { Injectable } from '@nitrostack/core';
import * as cheerio from 'cheerio';
import { SessionService } from '../auth/session.service.js';
import { PortalSessionExpiredError } from '../../common/errors.js';

const LEAVE_LIST_URL = 'https://students.amrita.edu/client/leave-list';
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export interface LeaveEntry {
  id: string;
  type: string;
  from: string;
  to: string;
  status: string;
  reason: string;
  createdOn: string;
}

@Injectable({ deps: [SessionService] })
export class LeaveService {
  constructor(private readonly session: SessionService) {}

  async getLeaveList(): Promise<LeaveEntry[]> {
    if (!this.session.isAuthenticated()) {
      throw new PortalSessionExpiredError();
    }

    const res = await fetch(LEAVE_LIST_URL, {
      redirect: 'manual',
      headers: {
        Cookie: this.session.cookieHeaderFor('students.amrita.edu'),
        'User-Agent': BROWSER_UA,
      },
    });

    if (res.status !== 200) {
      throw new PortalSessionExpiredError();
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const entries: LeaveEntry[] = [];

    $('table#home_tab tr').each((i, el) => {
      if (i === 0) return; // header row

      const cells = $(el).find('th, td');
      if (cells.length < 7) return;

      entries.push({
        id: $(cells[0]).text().trim(),
        type: $(cells[1]).text().trim(),
        from: $(cells[2]).text().trim(),
        to: $(cells[3]).text().trim(),
        status: $(cells[4]).text().trim(),
        reason: $(cells[5]).text().trim(),
        createdOn: $(cells[6]).text().trim(),
      });
    });

    return entries;
  }
}

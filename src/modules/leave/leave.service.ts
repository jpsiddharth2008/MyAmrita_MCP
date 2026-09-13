import { Injectable } from '@nitrostack/core';
import { PortalHttpClient } from '../../common/portal-http-client.js';
import { parseDataRows } from '../../common/html-table-parser.js';

const LEAVE_LIST_URL = 'https://students.amrita.edu/client/leave-list';

export interface LeaveEntry {
  id: string;
  type: string;
  from: string;
  to: string;
  status: string;
  reason: string;
  createdOn: string;
}

@Injectable({ deps: [PortalHttpClient] })
export class LeaveService {
  constructor(private readonly http: PortalHttpClient) {}

  async getLeaveList(): Promise<LeaveEntry[]> {
    const $ = await this.http.fetchPage(LEAVE_LIST_URL);

    return parseDataRows($, 'table#home_tab tr', 7, (cells) => ({
      id: cells[0].text().trim(),
      type: cells[1].text().trim(),
      from: cells[2].text().trim(),
      to: cells[3].text().trim(),
      status: cells[4].text().trim(),
      reason: cells[5].text().trim(),
      createdOn: cells[6].text().trim(),
    }));
  }
}

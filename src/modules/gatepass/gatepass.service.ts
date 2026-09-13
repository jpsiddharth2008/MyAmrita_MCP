import { Injectable } from '@nitrostack/core';
import { PortalHttpClient } from '../../common/portal-http-client.js';
import { parseDataRows } from '../../common/html-table-parser.js';

const HOSTEL_URL = 'https://students.amrita.edu/hostel/index';

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

@Injectable({ deps: [PortalHttpClient] })
export class GatePassService {
  constructor(private readonly http: PortalHttpClient) {}

  async getGatePasses(): Promise<GatePassEntry[]> {
    const $ = await this.http.fetchPage(HOSTEL_URL);

    return parseDataRows($, 'table#home_tab tr', 7, (cells) => ({
      id: cells[0].text().trim(),
      passName: cells[1].text().trim(),
      from: cells[2].text().trim(),
      to: cells[3].text().trim(),
      levelStatus: cells[4].text().trim(),
      finalStatus: cells[5].text().trim(),
      createdOn: cells[6].text().trim(),
    }));
  }

  /**
   * Submits a new gate pass request. Only ever called after the caller (a
   * tool method) has already gated this behind an explicit confirm:true —
   * this method itself always submits immediately, it does not know about
   * dry-run semantics.
   */
  async submitGatePass(request: GatePassRequest): Promise<GatePassEntry[]> {
    const $ = await this.http.fetchPage(HOSTEL_URL);
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

    await this.http.postForm(HOSTEL_URL, form);

    // Best-effort confirmation: re-fetch the list so the caller can see whether the new entry appeared.
    return this.getGatePasses();
  }
}

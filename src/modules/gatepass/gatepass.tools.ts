import {
  ToolDecorator as Tool,
  ControllerDecorator as Controller,
  Injectable,
  UseFilters,
  ExecutionContext,
  z,
} from '@nitrostack/core';
import { GatePassService } from './gatepass.service.js';
import { SessionExpiredFilter } from '../../common/session-expired.filter.js';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

@Controller('gatepass')
@Injectable({ deps: [GatePassService] })
export class GatePassTools {
  constructor(private readonly gatePass: GatePassService) {}

  @Tool({
    name: 'get_gate_passes',
    description:
      'Get the list of submitted gate pass requests (Home Pass / Out Pass) from the Amrita hostel portal, ' +
      'including date range, approval status, and when each was created. Requires an active login session ' +
      '(see auth_login).',
    inputSchema: z.object({}),
  })
  @UseFilters(SessionExpiredFilter)
  async getGatePasses(_input: {}, ctx: ExecutionContext) {
    const gatePasses = await this.gatePass.getGatePasses();
    ctx.logger.info('Fetched gate passes', { count: gatePasses.length });
    return { gatePasses };
  }

  @Tool({
    name: 'request_gate_pass',
    description:
      'Request a new gate pass (Home Pass or Out Pass) on the Amrita hostel portal. THIS SUBMITS A REAL ' +
      'REQUEST TO THE COLLEGE — never call this with confirm:true unless the user has explicitly, verbally ' +
      'confirmed the exact pass type, reason, and date/time range in this conversation. Always call it first ' +
      'with confirm omitted (or false) to get a preview of exactly what would be submitted — nothing is sent ' +
      'to the portal in that case. Only call again with confirm:true, using the exact same details, after the ' +
      'user has confirmed the preview. Note: the portal requires gate passes to be approved at least 30 ' +
      'minutes before the scheduled leaving time. Requires an active login session (see auth_login).',
    inputSchema: z.object({
      passType: z.enum(['home', 'out']).describe('"home" for a multi-day Home Pass, "out" for a same-day Out Pass.'),
      reason: z.string().min(1).describe('Reason for the pass, shown to the approving warden.'),
      fromDate: z.string().regex(DATE_REGEX).describe('Start date, YYYY-MM-DD.'),
      fromTime: z.string().regex(TIME_REGEX).describe('Start time, 24-hour HH:MM.'),
      toDate: z.string().regex(DATE_REGEX).describe('End date, YYYY-MM-DD (same as fromDate for an Out Pass).'),
      toTime: z.string().regex(TIME_REGEX).describe('End time, 24-hour HH:MM.'),
      confirm: z
        .boolean()
        .default(false)
        .describe('Must be explicitly true to actually submit. Omit or leave false to preview only.'),
    }),
  })
  @UseFilters(SessionExpiredFilter)
  async requestGatePass(
    input: {
      passType: 'home' | 'out';
      reason: string;
      fromDate: string;
      fromTime: string;
      toDate: string;
      toTime: string;
      confirm: boolean;
    },
    ctx: ExecutionContext
  ) {
    const preview = {
      passType: input.passType,
      reason: input.reason,
      from: `${input.fromDate} ${input.fromTime}`,
      to: `${input.toDate} ${input.toTime}`,
    };

    if (!input.confirm) {
      ctx.logger.info('Previewed gate pass request (not submitted)', preview);
      return {
        submitted: false,
        message:
          'Preview only — nothing has been submitted to the portal. Confirm these exact details with the ' +
          'user, then call this tool again with confirm: true to actually submit.',
        preview,
      };
    }

    const gatePasses = await this.gatePass.submitGatePass(input);
    ctx.logger.info('Submitted gate pass request', preview);

    return {
      submitted: true,
      request: preview,
      gatePasses,
    };
  }
}

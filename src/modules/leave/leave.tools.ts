import {
  ToolDecorator as Tool,
  ControllerDecorator as Controller,
  Injectable,
  UseFilters,
  ExecutionContext,
  z,
} from '@nitrostack/core';
import { LeaveService } from './leave.service.js';
import { SessionExpiredFilter } from '../../common/session-expired.filter.js';

@Controller('leave')
@Injectable({ deps: [LeaveService] })
export class LeaveTools {
  constructor(private readonly leave: LeaveService) {}

  @Tool({
    name: 'get_leave_list',
    description:
      'Get the list of submitted leave/duty-leave requests from the Amrita student portal, including type, ' +
      'date range, status (Approved/Pending/Rejected), reason, and when each was created. Requires an active ' +
      'login session (see auth_login).',
    inputSchema: z.object({}),
  })
  @UseFilters(SessionExpiredFilter)
  async getLeaveList(_input: {}, ctx: ExecutionContext) {
    const entries = await this.leave.getLeaveList();
    ctx.logger.info('Fetched leave list', { count: entries.length });
    return { entries };
  }
}

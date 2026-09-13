import {
  ToolDecorator as Tool,
  ControllerDecorator as Controller,
  Injectable,
  UseFilters,
  ExecutionContext,
  z,
} from '@nitrostack/core';
import { MarksService } from './marks.service.js';
import { SessionExpiredFilter } from '../../common/session-expired.filter.js';

@Controller('marks')
@Injectable({ deps: [MarksService] })
export class MarksTools {
  constructor(private readonly marksService: MarksService) {}

  @Tool({
    name: 'get_marks',
    description:
      'Get internal/continuous assessment marks (quizzes, mid-terms, etc.) from the Amrita student portal, ' +
      'one entry per graded component per course. The response includes which academic term this data is for ' +
      '(term.label) — the portal\'s default term is not always the latest calendar semester, so always check ' +
      'this field rather than assuming the data is "current". Requires an active login session (see auth_login).',
    inputSchema: z.object({
      academicTermId: z
        .string()
        .optional()
        .describe('Optional academic term id to view a past term instead of the portal\'s default term.'),
    }),
  })
  @UseFilters(SessionExpiredFilter)
  async getMarks(input: { academicTermId?: string }, ctx: ExecutionContext) {
    const { term, marks } = await this.marksService.getMarks(input.academicTermId);
    ctx.logger.info('Fetched marks', { term: term?.label, entryCount: marks.length });
    return { term, marks };
  }
}

import { Module } from '@nitrostack/core';
import { AuthModule } from '../auth/auth.module.js';
import { MarksService } from './marks.service.js';
import { MarksTools } from './marks.tools.js';

@Module({
  name: 'marks',
  description: 'Reads internal/continuous assessment marks from the Amrita student portal',
  imports: [AuthModule],
  providers: [MarksService],
  controllers: [MarksTools],
})
export class MarksModule {}

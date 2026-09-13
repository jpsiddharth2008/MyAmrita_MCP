import { Module } from '@nitrostack/core';
import { AuthModule } from '../auth/auth.module.js';
import { LeaveService } from './leave.service.js';
import { LeaveTools } from './leave.tools.js';

@Module({
  name: 'leave',
  description: 'Reads submitted leave/duty-leave requests from the Amrita student portal',
  imports: [AuthModule],
  providers: [LeaveService],
  controllers: [LeaveTools],
})
export class LeaveModule {}

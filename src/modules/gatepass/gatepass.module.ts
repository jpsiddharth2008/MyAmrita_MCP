import { Module } from '@nitrostack/core';
import { AuthModule } from '../auth/auth.module.js';
import { GatePassService } from './gatepass.service.js';
import { GatePassTools } from './gatepass.tools.js';

@Module({
  name: 'gatepass',
  description: 'Reads and submits gate pass (Home Pass / Out Pass) requests on the Amrita hostel portal',
  imports: [AuthModule],
  providers: [GatePassService],
  controllers: [GatePassTools],
})
export class GatePassModule {}

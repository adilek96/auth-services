import { Module } from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { RegistrationResolver } from './registration.resolver';
import { PrismaService } from 'src/prisma/prisma.service';
import { VerificationModule } from '../verification/verification.module';

@Module({
  imports: [VerificationModule],
  providers: [RegistrationService, RegistrationResolver, PrismaService],
  exports: [RegistrationService],
})
export class RegistrationModule {}

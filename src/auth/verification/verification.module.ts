import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { VerificationResolver } from './verification.resolver';
import { PrismaModule } from '../../prisma/prisma.module';
import { LoginModule } from '../login/login.module';

@Module({
  imports: [PrismaModule, LoginModule],
  providers: [VerificationService, VerificationResolver],
  exports: [VerificationService],
})
export class VerificationModule {} 
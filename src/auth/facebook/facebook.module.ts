import { Module } from '@nestjs/common';
import { FacebookService } from './facebook.service';
import { FacebookResolver } from './facebook.resolver';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [FacebookService, FacebookResolver],
  exports: [FacebookService],
})
export class FacebookModule {} 
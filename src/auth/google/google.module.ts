import { Module } from '@nestjs/common';
import { GoogleService } from './google.service';
import { GoogleResolver } from './google.resolver';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [GoogleService, GoogleResolver],
  exports: [GoogleService],
})
export class GoogleModule {} 
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Экспортируем, чтобы использовать в других модулях
})
export class PrismaModule {}

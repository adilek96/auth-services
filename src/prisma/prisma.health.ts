import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaHealthIndicator {
  constructor(private readonly prisma: PrismaService) {}

  async check(key: string) {
    try {
      // простейший запрос в БД
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        [key]: {
          status: 'up'
        }
      };
    } catch (error) {
      throw new HttpException({
        status: 'error',
        message: 'Prisma check failed',
        details: {
          [key]: {
            status: 'down',
            error: error.message
          }
        }
      }, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}

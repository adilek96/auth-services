import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma/prisma.health';



@Controller('/')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private prisma: PrismaHealthIndicator,
   
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    return {
      status: 'ok',
      details: {
        graphql: await this.checkGraphQL(),
        database: await this.checkDatabase(),
        
      }
    };
  }

  private async checkGraphQL() {
    try {
      await this.http.pingCheck('graphql', 'http://localhost:4001/graphql');
      return { status: 'up' };
    } catch (error) {
      return { status: 'down', message: error.message };
    }
  }

  private async checkDatabase() {
    try {
      return await this.prisma.check('database');
    } catch (error) {
      return { database: { status: 'down', message: error.message } };
    }
  }

  
}

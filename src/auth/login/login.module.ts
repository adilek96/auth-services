import { Module } from '@nestjs/common';
import { LoginService } from './login.service';
import { LoginResolver } from './login.resolver';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  providers: [LoginService, LoginResolver, JwtStrategy],
  exports: [LoginService],
})
export class LoginModule {} 
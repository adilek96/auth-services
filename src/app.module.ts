import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { RegistrationModule } from './auth/registration/registration.module';
import { PrismaModule } from './prisma/prisma.module';
import { AppResolver } from './app.resolver';
import { VerificationModule } from './auth/verification/verification.module';
import { LoginModule } from './auth/login/login.module';
import { GoogleModule } from './auth/google/google.module';
import { FacebookModule } from './auth/facebook/facebook.module';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './prisma/prisma.health';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: true,
    }),
    RegistrationModule,
    PrismaModule,
    VerificationModule,
    LoginModule,
    GoogleModule,
    FacebookModule,
    TerminusModule,
    HttpModule,
  ],
  controllers: [HealthController],
  providers: [PrismaHealthIndicator,AppResolver],
})
export class AppModule {}

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
  ],
  providers: [AppResolver],
})
export class AppModule {}

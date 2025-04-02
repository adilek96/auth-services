import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { VerificationService } from './verification.service';
import { VerifyResponse } from './models/verify-response.model';

@Resolver()
export class VerificationResolver {
  constructor(private verificationService: VerificationService) {}

  @Mutation(() => VerifyResponse)
  async verifyEmail(
    @Args('email') email: string,
    @Args('code') code: string
  ): Promise<VerifyResponse> {
    return this.verificationService.verifyOTP(email, code);
  }
} 
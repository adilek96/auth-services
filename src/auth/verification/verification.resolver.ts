import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { VerificationService } from './verification.service';
import { VerifyOtpInput } from './dto/verify-otp.input';

@Resolver()
export class VerificationResolver {
  constructor(private verificationService: VerificationService) {}

  @Mutation(() => Boolean)
  async verifyOTP(@Args('data') data: VerifyOtpInput): Promise<boolean> {
    return this.verificationService.verifyOTP(data.email, data.otp);
  }
} 
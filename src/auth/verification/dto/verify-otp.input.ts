import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, Length } from 'class-validator';
import { AuthResponse } from '../../login/models/auth.model';

@InputType()
export class VerifyOtpInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  @Length(6, 6, { message: 'OTP code must be exactly 6 characters' })
  otp: string;
}

@InputType()
export class VerifyOtpResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => AuthResponse, { nullable: true })
  auth?: AuthResponse;
} 
import { ObjectType, Field } from '@nestjs/graphql';
import { AuthResponse } from '../../login/models/auth.model';

@ObjectType('VerifyResponse')
export class VerifyResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => String)
  message!: string;

  @Field(() => AuthResponse, { nullable: true })
  auth?: AuthResponse;

  @Field(() => String)
  accessToken!: string;

  @Field(() => String)
  refreshToken!: string;

  @Field(() => String)
  email!: string;

  @Field(() => String)
  name!: string;
} 
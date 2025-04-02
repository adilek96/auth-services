import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class FacebookAuthInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  token: string;
} 
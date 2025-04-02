import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType('User')
export class User {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  email!: string;

  @Field(() => String)
  name!: string;

  @Field(() => Boolean)
  isVerified!: boolean;
} 
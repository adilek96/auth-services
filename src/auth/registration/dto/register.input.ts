import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, MinLength, Matches, ValidateIf } from 'class-validator';

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @MinLength(6)
  password: string;

  @Field()
  @MinLength(6)
  confirmPassword: string;

  @Field()
  @Matches(/^[A-Za-zА-Яа-яЁё\s]+$/, { message: 'Name must contain only letters and spaces' })
  name: string;
}

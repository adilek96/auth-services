import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { RegistrationService } from './registration.service';
import { RegisterInput } from './dto/register.input';
import { User } from '../models/user.model';

@Resolver()
export class RegistrationResolver {
  constructor(private registrationService: RegistrationService) {}

  @Mutation(() => User)
  async register(@Args('data') data: RegisterInput): Promise<User> {
    return this.registrationService.register(
      data.email,
      data.password,
      data.confirmPassword,
      data.name
    );
  }
}

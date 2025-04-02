import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { RegistrationService } from './registration.service';
import { User } from '../models/user.model';

@Resolver()
export class RegistrationResolver {
  constructor(private registrationService: RegistrationService) {}

  @Mutation(() => User)
  async register(
    @Args('email') email: string,
    @Args('password') password: string,
    @Args('confirmPassword') confirmPassword: string,
    @Args('name') name: string
  ): Promise<User> {
    return this.registrationService.register(email, password, confirmPassword, name);
  }
}

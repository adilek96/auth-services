import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { FacebookService } from './facebook.service';
import { FacebookAuthInput } from './dto/facebook-auth.input';
import { AuthResponse } from '../login/models/auth.model';

@Resolver()
export class FacebookResolver {
  constructor(private readonly facebookService: FacebookService) {}

  @Mutation(() => AuthResponse)
  async facebookAuth(@Args('token') token: string): Promise<AuthResponse> {
    return this.facebookService.authenticate(token);
  }
} 
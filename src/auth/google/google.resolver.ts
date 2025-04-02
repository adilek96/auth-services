import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { GoogleService } from './google.service';
import { GoogleAuthInput } from './dto/google-auth.input';
import { AuthResponse } from '../login/models/auth.model';

@Resolver()
export class GoogleResolver {
  constructor(private readonly googleService: GoogleService) {}

  @Mutation(() => AuthResponse)
  async googleAuth(@Args('token') token: string): Promise<AuthResponse> {
    return this.googleService.authenticate(token);
  }
} 
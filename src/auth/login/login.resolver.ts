import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { LoginService } from './login.service';
import { LoginInput } from './dto/login.input';
import { AuthResponse } from './models/auth.model';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../guards/gql-auth.guard';

@Resolver()
export class LoginResolver {
  constructor(private readonly loginService: LoginService) {}

  @Mutation(() => AuthResponse)
  async login(@Args('email') email: string, @Args('password') password: string): Promise<AuthResponse> {
    return this.loginService.login(email, password);
  }

  @Mutation(() => AuthResponse)
  async refreshTokens(
    @Args('refreshToken') refreshToken: string
  ): Promise<AuthResponse> {
    return this.loginService.refreshTokens(refreshToken);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async logout(@Context('user') user: any): Promise<boolean> {
    return this.loginService.logout(user.userId);
  }
} 
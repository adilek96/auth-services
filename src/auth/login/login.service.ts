import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { AuthResponse } from './models/auth.model';
import { User } from '../models/user.model';

@Injectable()
export class LoginService {
  private readonly jwtSecret: string;
  private readonly refreshSecret: string;

  constructor(private prisma: PrismaService) {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET is not defined');
    }
    this.jwtSecret = process.env.JWT_SECRET;
    this.refreshSecret = process.env.JWT_REFRESH_SECRET;
  }

  private generateTokens(userId: string, email: string, isVerified: boolean) {
    const accessToken = jwt.sign(
      { 
        userId,
        email,
        isVerified
      },
      this.jwtSecret,
      { expiresIn: '15m' } // Короткий срок жизни
    );

    const refreshToken = jwt.sign(
      { 
        userId,
        email,
        isVerified
      },
      this.refreshSecret,
      { expiresIn: '7d' } // Длительный срок жизни
    );

    return { accessToken, refreshToken };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new BadRequestException('Please verify your email first');
    }

    return this.generateAuthResponse(user);
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponse> {
    try {
      const decoded = jwt.verify(refreshToken, this.refreshSecret) as { userId: string };
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateAuthResponse(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<boolean> {
    // Удаляем refresh token из базы
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null }
    });
    return true;
  }

  async generateAuthResponse(user: { id: string; email: string; name: string | null; isVerified: boolean }): Promise<AuthResponse> {
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, isVerified: user.isVerified },
      this.jwtSecret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      this.refreshSecret,
      { expiresIn: '7d' }
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return {
      accessToken,
      refreshToken,
      email: user.email,
      name: user.name || '',
    };
  }
} 
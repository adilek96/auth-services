import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { AuthResponse } from './models/auth.model';

@Injectable()
export class LoginService {
  private readonly jwtSecret: string;
  private readonly refreshSecret: string;

  constructor(private prisma: PrismaService) {
    const secret = process.env.JWT_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    
    if (!secret || !refreshSecret) {
      throw new Error('JWT secrets are not defined in environment variables');
    }
    
    this.jwtSecret = secret;
    this.refreshSecret = refreshSecret;
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

    const { accessToken, refreshToken } = this.generateTokens(
      user.id,
      user.email,
      user.isVerified
    );

    // Сохраняем refresh token в базе
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    return {
      accessToken,
      refreshToken,
      email: user.email,
      name: user.name || '',
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponse> {
    try {
      // Проверяем refresh token
      const payload = jwt.verify(refreshToken, this.refreshSecret) as {
        userId: string;
        email: string;
        isVerified: boolean;
      };

      // Проверяем, что токен совпадает с сохраненным в базе
      const user = await this.prisma.user.findFirst({
        where: {
          id: payload.userId,
          refreshToken: refreshToken
        }
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Генерируем новые токены
      const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(
        user.id,
        user.email,
        user.isVerified
      );

      // Обновляем refresh token в базе
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken }
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
        email: user.email,
        name: user.name || '',
      };
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
} 
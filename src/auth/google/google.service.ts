import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OAuth2Client } from 'google-auth-library';
import { AuthResponse } from '../login/models/auth.model';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';

@Injectable()
export class GoogleService {
  private readonly client: OAuth2Client;
  private readonly jwtSecret: string;
  private readonly refreshSecret: string;

  constructor(private prisma: PrismaService) {
    this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
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
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { 
        userId,
        email,
        isVerified
      },
      this.refreshSecret,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  async authenticate(token: string): Promise<AuthResponse> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid Google token');
      }

      const { email, name, sub: googleId } = payload;
      
      if (!email) {
        throw new UnauthorizedException('Email is required');
      }

      // Проверяем, существует ли пользователь
      let user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { googleId }
          ]
        }
      });

      if (!user) {
        // Создаем нового пользователя
        user = await this.prisma.user.create({
          data: {
            email,
            name,
            googleId,
            isVerified: true, // Google уже верифицировал email
            password: await bcrypt.hash(Math.random().toString(36), 10), // Генерируем случайный пароль
          }
        });
      } else if (!user.googleId) {
        // Если пользователь существует, но не привязан к Google
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId }
        });
      }

      const { accessToken, refreshToken } = this.generateTokens(
        user.id,
        user.email,
        user.isVerified
      );

      // Сохраняем refresh token
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
    } catch (error) {
      throw new UnauthorizedException('Invalid Google token');
    }
  }
} 
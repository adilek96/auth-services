import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthResponse } from '../login/models/auth.model';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import * as FB from 'facebook-node-sdk';

@Injectable()
export class FacebookService {
  private readonly fb: FB;
  private readonly jwtSecret: string;
  private readonly refreshSecret: string;

  constructor(private prisma: PrismaService) {
    this.fb = new FB({
      appId: process.env.FACEBOOK_APP_ID,
      appSecret: process.env.FACEBOOK_APP_SECRET,
    });

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
      // Проверяем токен через Facebook API
      const response = await this.fb.api('/me', {
        fields: ['id', 'email', 'name'],
        access_token: token
      });

      if (!response || !response.id) {
        throw new UnauthorizedException('Invalid Facebook token');
      }

      const { email, name, id: facebookId } = response;
      
      if (!email) {
        throw new UnauthorizedException('Email is required');
      }

      // Проверяем, существует ли пользователь
      let user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { facebookId }
          ]
        }
      });

      if (!user) {
        // Создаем нового пользователя
        user = await this.prisma.user.create({
          data: {
            email,
            name,
            facebookId,
            isVerified: true, // Facebook уже верифицировал email
            password: await bcrypt.hash(Math.random().toString(36), 10), // Генерируем случайный пароль
          }
        });
      } else if (!user.facebookId) {
        // Если пользователь существует, но не привязан к Facebook
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { facebookId }
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
      throw new UnauthorizedException('Invalid Facebook token');
    }
  }
} 
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import { VerifyResponse } from './models/verify-response.model';
import { LoginService } from '../login/login.service';

@Injectable()
export class VerificationService {
  private transporter: nodemailer.Transporter;
  private readonly VERIFICATION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

  constructor(
    private prisma: PrismaService,
    private loginService: LoginService,
  ) {
    // Создаем транспортер для отправки email
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Запускаем проверку неверифицированных пользователей каждые 5 минут
    setInterval(() => this.checkUnverifiedUsers(), 5 * 60 * 1000);
  }

  private generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  async checkUnverifiedUsers(): Promise<void> {
    const thirtyMinutesAgo = new Date();
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

    const unverifiedUsers = await this.prisma.user.findMany({
      where: {
        isVerified: false,
        createdAt: {
          lt: thirtyMinutesAgo,
        },
        googleId: null,
        facebookId: null,
      },
    });

    for (const user of unverifiedUsers) {
      // Сначала удаляем все коды верификации
      await this.prisma.verificationCode.deleteMany({
        where: { userId: user.id },
      });

      // Затем удаляем пользователя
      await this.prisma.user.delete({
        where: { id: user.id },
      });
    }
  }

  private async sendVerificationEmail(email: string, code: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@yourdomain.com',
        to: email,
        subject: 'Подтверждение email',
        html: `
          <h1>Подтверждение email</h1>
          <p>Ваш код подтверждения: <strong>${code}</strong></p>
          <p>Этот код действителен в течение 30 минут.</p>
          <p>Если вы не запрашивали подтверждение email, проигнорируйте это письмо.</p>
        `,
      });
    } catch (error) {
      console.error('Ошибка отправки email:', error);
      // В случае ошибки отправки email, выводим код в консоль для отладки
      console.log(`Код подтверждения для ${email}: ${code}`);
    }
  }

  async sendOTP(email: string): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    const code = this.generateOTP();
    const expiresAt = new Date(Date.now() + this.VERIFICATION_TIMEOUT);

    await this.prisma.verificationCode.create({
      data: {
        userId: user.id,
        code,
        expiresAt,
      },
    });

    await this.sendVerificationEmail(email, code);

    return {
      success: true,
      message: 'Код подтверждения отправлен на email',
    };
  }

  async verifyOTP(email: string, otp: string): Promise<VerifyResponse> {
    const user = await this.prisma.user.findUnique({ 
      where: { email },
      include: { verificationCodes: true }
    });

    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    const verificationCode = user.verificationCodes.find(
      code => code.code === otp && !code.used && code.expiresAt > new Date()
    );

    if (!verificationCode) {
      throw new BadRequestException('Неверный или просроченный код подтверждения');
    }

    await this.prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { used: true },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    // Генерируем токены после успешной верификации
    const auth = await this.loginService.generateAuthResponse({
      id: user.id,
      email: user.email,
      name: user.name || '',
      isVerified: true,
    });

    return {
      success: true,
      message: 'Email успешно подтвержден',
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      email: auth.email,
      name: auth.name,
    };
  }
} 
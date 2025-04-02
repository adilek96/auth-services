import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';

@Injectable()
export class VerificationService {
  private transporter: nodemailer.Transporter;
  private readonly VERIFICATION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

  constructor(private prisma: PrismaService) {
    const smtpPort = process.env.SMTP_PORT;
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM;

    if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
      throw new Error('SMTP configuration is incomplete');
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort ? parseInt(smtpPort) : 587,
      // secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Запускаем проверку неверифицированных пользователей каждые 5 минут
    setInterval(() => this.checkUnverifiedUsers(), 5 * 60 * 1000);
  }

  private generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  async checkUnverifiedUsers() {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Находим неверифицированных пользователей без социальных ID
    const unverifiedUsers = await this.prisma.user.findMany({
      where: {
        isVerified: false,
        googleId: null,
        facebookId: null,
        createdAt: {
          lt: thirtyMinutesAgo
        }
      }
    });

    // Удаляем найденных пользователей
    for (const user of unverifiedUsers) {
      // Сначала удаляем все коды верификации пользователя
      await this.prisma.verificationCode.deleteMany({
        where: { userId: user.id }
      });
      
      // Затем удаляем самого пользователя
      await this.prisma.user.delete({
        where: { id: user.id }
      });
    }
  }

  async sendOTP(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('User is already verified');
    }

    const otp = this.generateOTP();
    const otpExpiry = new Date(Date.now() + this.VERIFICATION_TIMEOUT);

    // Сохраняем OTP в базе
    await this.prisma.verificationCode.create({
      data: {
        userId: user.id,
        code: otp,
        expiresAt: otpExpiry,
      },
    });

    // Отправляем email
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Email Verification Code',
      html: `
        <h1>Email Verification</h1>
        <p>Your verification code is: <strong>${otp}</strong></p>
        <p>This code will expire in 30 minutes.</p>
        <p>If you don't verify your email within 30 minutes, your account will be automatically deleted.</p>
      `,
    });

    return true;
  }

  async verifyOTP(email: string, otp: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const verificationCode = await this.prisma.verificationCode.findFirst({
      where: {
        userId: user.id,
        code: otp,
        expiresAt: {
          gt: new Date(),
        },
        used: false,
      },
    });

    if (!verificationCode) {
      throw new BadRequestException('Invalid or expired OTP code');
    }

    // Помечаем код как использованный
    await this.prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { used: true },
    });

    // Помечаем пользователя как верифицированного
    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    return true;
  }
} 
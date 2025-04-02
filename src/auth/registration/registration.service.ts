import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { User } from '../models/user.model';
import { VerificationService } from '../verification/verification.service';

@Injectable()
export class RegistrationService {
  constructor(
    private prisma: PrismaService,
    private verificationService: VerificationService,
  ) {}

  async register(email: string, password: string, confirmPassword: string, name?: string): Promise<User> {
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await this.prisma.user.create({
      data: { email, password: hashedPassword, name: name || '', isVerified: false },
    });

    // Отправляем OTP после успешной регистрации
    await this.verificationService.sendOTP(email);

    return {
      id: user.id,
      email: user.email,
      name: user.name || '',
      isVerified: user.isVerified,
    };
  }
}

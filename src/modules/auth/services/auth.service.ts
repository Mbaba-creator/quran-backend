import { Injectable, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string, displayName: string, gender: 'men' | 'women') {
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }
    if (gender !== 'men' && gender !== 'women') {
      throw new BadRequestException('Gender must be men or women');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({
      email,
      password_hash: passwordHash,
      display_name: displayName,
      gender,
    });

    return this.generateToken(user);
  }

  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isBanned) {
      throw new ForbiddenException(user.banReason || 'Account suspended');
    }

    return this.generateToken(user);
  }

  private generateToken(user: any) {
    const payload = { sub: user._id, email: user.email, role: user.role, gender: user.gender };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
        gender: user.gender,
      },
    };
  }
}

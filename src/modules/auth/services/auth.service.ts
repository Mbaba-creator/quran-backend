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

  async register(
    email: string,
    password: string,
    displayName: string,
    gender: 'men' | 'women',
    role: 'student' | 'teacher' = 'student',
    hasTaughtBefore = false,
    isHafiz = false,
    teacherExperience = '',
  ) {
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }
    if (gender !== 'men' && gender !== 'women') {
      throw new BadRequestException('Gender must be men or women');
    }
    if (role !== 'student' && role !== 'teacher') {
      throw new BadRequestException('Invalid role');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({
      email,
      password_hash: passwordHash,
      display_name: displayName,
      gender,
      role,
      hasTaughtBefore: role === 'teacher' ? hasTaughtBefore : false,
      isHafiz: role === 'teacher' ? isHafiz : false,
      teacherExperience: role === 'teacher' ? teacherExperience : '',
    });

    return this.generateToken(user);
  }

  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.password_hash) {
      throw new UnauthorizedException('This account uses Google sign-in');
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

  async handleGoogleLogin(googleId: string, email: string, name: string) {
    let user = await this.userModel.findOne({ googleId });
    if (!user) {
      user = await this.userModel.findOne({ email });
    }

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
      if (user.isBanned) {
        return { error: user.banReason || 'Account suspended' };
      }
      return { existing: true, ...this.generateToken(user) };
    }

    const pendingToken = this.jwtService.sign(
      { googleId, email, name, purpose: 'google_pending' },
      { expiresIn: '10m' },
    );
    return { existing: false, pendingToken, profile: { email, name } };
  }

  async completeGoogleRegistration(
    pendingToken: string,
    gender: 'men' | 'women',
    role: 'student' | 'teacher' = 'student',
    hasTaughtBefore = false,
    isHafiz = false,
    teacherExperience = '',
  ) {
    let payload: any;
    try {
      payload = this.jwtService.verify(pendingToken);
    } catch (e) {
      throw new BadRequestException('Invalid or expired session, please try Google sign-in again');
    }
    if (payload.purpose !== 'google_pending') {
      throw new BadRequestException('Invalid token');
    }

    const existingUser = await this.userModel.findOne({ email: payload.email });
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const user = await this.userModel.create({
      email: payload.email,
      googleId: payload.googleId,
      display_name: payload.name,
      gender,
      role,
      hasTaughtBefore: role === 'teacher' ? hasTaughtBefore : false,
      isHafiz: role === 'teacher' ? isHafiz : false,
      teacherExperience: role === 'teacher' ? teacherExperience : '',
    });

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

import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body()
    body: {
      email: string;
      password: string;
      displayName: string;
      gender: 'men' | 'women';
      role?: 'student' | 'teacher';
      hasTaughtBefore?: boolean;
      isHafiz?: boolean;
      teacherExperience?: string;
    },
  ) {
    return this.authService.register(
      body.email,
      body.password,
      body.displayName,
      body.gender,
      body.role || 'student',
      body.hasTaughtBefore || false,
      body.isHafiz || false,
      body.teacherExperience || '',
    );
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }
}

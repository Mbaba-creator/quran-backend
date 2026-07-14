import { Controller, Post, Get, Body, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
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

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const profile = req.user;
    const result = await this.authService.handleGoogleLogin(profile.googleId, profile.email, profile.name);
    const payload = JSON.stringify(result).replace(/</g, '\\u003c');
    res.send(
      '<html><body><script>' +
        'window.opener.postMessage(' + payload + ', \"*\");' +
        'window.close();' +
        '</script></body></html>',
    );
  }

  @Post('google/complete')
  async completeGoogle(
    @Body()
    body: {
      pendingToken: string;
      gender: 'men' | 'women';
      role?: 'student' | 'teacher';
      hasTaughtBefore?: boolean;
      isHafiz?: boolean;
      teacherExperience?: string;
    },
  ) {
    return this.authService.completeGoogleRegistration(
      body.pendingToken,
      body.gender,
      body.role || 'student',
      body.hasTaughtBefore || false,
      body.isHafiz || false,
      body.teacherExperience || '',
    );
  }
}

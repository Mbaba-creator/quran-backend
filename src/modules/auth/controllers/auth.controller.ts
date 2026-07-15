import { Controller, Post, Get, Body, Query, Req, Res, UseGuards } from '@nestjs/common';
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

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.requestPasswordReset(body.email);
  }

  @Get('reset-password')
  async resetPasswordPage(@Query('token') token: string, @Res() res: Response) {
    const html =
      '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>Reset Password</title>' +
      '<style>body{font-family:sans-serif;background:#1a472a;color:white;display:flex;' +
      'align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;}' +
      '.box{background:#0f3620;border:1px solid #d4af37;border-radius:14px;padding:28px;' +
      'max-width:360px;width:100%;}h2{color:#d4af37;text-align:center;margin-bottom:18px;font-size:16px;}' +
      'input{width:100%;padding:11px;margin:6px 0;border-radius:8px;border:1px solid #444;' +
      'background:#222;color:white;box-sizing:border-box;font-size:13px;}' +
      'button{width:100%;padding:12px;margin-top:10px;background:#d4af37;color:#1a472a;' +
      'border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px;}' +
      '#msg{text-align:center;margin-top:12px;font-size:13px;}</style></head><body>' +
      '<div class="box"><h2>Reset your password / إعادة تعيين كلمة المرور</h2>' +
      '<input type="password" id="newPassword" placeholder="New password">' +
      '<input type="password" id="confirmPassword" placeholder="Confirm password">' +
      '<button onclick="submitReset()">Reset Password</button>' +
      '<div id="msg"></div></div>' +
      '<script>' +
      'const token = ' + JSON.stringify(token) + ';' +
      'async function submitReset() {' +
      '  const p1 = document.getElementById("newPassword").value;' +
      '  const p2 = document.getElementById("confirmPassword").value;' +
      '  const msg = document.getElementById("msg");' +
      '  if (!p1 || p1.length < 6) { msg.textContent = "Password must be at least 6 characters"; return; }' +
      '  if (p1 !== p2) { msg.textContent = "Passwords do not match"; return; }' +
      '  try {' +
      '    const res = await fetch("/auth/reset-password/confirm", {' +
      '      method: "POST", headers: {"Content-Type":"application/json"},' +
      '      body: JSON.stringify({ token, newPassword: p1 })' +
      '    });' +
      '    const data = await res.json();' +
      '    if (!res.ok) { msg.textContent = data.message || "Failed"; return; }' +
      '    msg.textContent = "Password updated! You can close this window and log in.";' +
      '  } catch(e) { msg.textContent = "Network error"; }' +
      '}' +
      '</script></body></html>';
    res.send(html);
  }

  @Post('reset-password/confirm')
  async confirmReset(@Body() body: { token: string; newPassword: string }) {
    return this.authService.confirmPasswordReset(body.token, body.newPassword);
  }
}

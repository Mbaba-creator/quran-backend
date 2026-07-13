import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ComplaintsService } from './services/complaints.service';

@Controller('complaints')
export class ComplaintsController {
  constructor(private complaintsService: ComplaintsService) {}

  @Post()
  async submitComplaint(@Body() body: { email: string; message: string }) {
    if (!body.email || !body.message) {
      throw new BadRequestException('Email and message are required');
    }
    await this.complaintsService.sendComplaint(body.email, body.message);
    return { success: true };
  }
}

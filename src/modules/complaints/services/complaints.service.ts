import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class ComplaintsService {
  private resend = new Resend(process.env.RESEND_API_KEY);

  async sendComplaint(email: string, message: string) {
    const htmlBody =
      '<h2>Nueva queja recibida</h2>' +
      '<p><strong>Correo del remitente:</strong> ' + email + '</p>' +
      '<p><strong>Mensaje:</strong></p>' +
      '<p>' + message.replace(/\n/g, '<br>') + '</p>';

    const result = await this.resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'quran.learning.plataform@gmail.com',
      subject: 'Nueva queja - Plataforma Quran',
      html: htmlBody,
    });
    return result;
  }
}

import nodemailer from 'nodemailer';
import type { EmailMessage, EmailSender } from '../ports/emailSender.js';

export class SmtpEmailSender implements EmailSender {
  private readonly transporter;

  constructor(host: string, port: number) {
    this.transporter = nodemailer.createTransport({ host, port, secure: false, ignoreTLS: true });
  }

  async send(message: EmailMessage): Promise<void> {
    await this.transporter.sendMail(message);
  }
}

// Production swap: implement EmailSender with the AWS SDK SES client and inject it in server.ts.

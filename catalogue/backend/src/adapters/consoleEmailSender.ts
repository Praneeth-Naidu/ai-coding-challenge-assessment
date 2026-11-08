import type { EmailMessage, EmailSender } from '../ports/emailSender.js';

export class ConsoleEmailSender implements EmailSender {
  async send(message: EmailMessage): Promise<void> {
    process.stdout.write(`${JSON.stringify({ event: 'email.preview', ...message })}\n`);
  }
}

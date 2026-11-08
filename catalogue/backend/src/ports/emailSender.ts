export interface EmailMessage {
  to: string;
  from: string;
  subject: string;
  text: string;
  replyTo?: string;
}

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

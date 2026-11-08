import { AppError } from '../domain/errors.js';
import type { Enquiry } from '../domain/enquiry.js';
import type { EmailSender } from '../ports/emailSender.js';
import type { ProductSource } from '../ports/productSource.js';

const stripHeaderBreaks = (value: string): string => value.replace(/[\r\n]/g, '').trim();

export class EnquiryService {
  constructor(
    private readonly source: ProductSource,
    private readonly emailSender: EmailSender,
    private readonly salesInbox: string,
    private readonly mailFrom: string
  ) {}

  async submit(input: Enquiry): Promise<void> {
    const product = await this.source.getProduct(input.productId);
    if (!product) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'The requested product was not found.');

    const name = stripHeaderBreaks(input.name);
    const email = stripHeaderBreaks(input.email);
    const phone = input.phone ? stripHeaderBreaks(input.phone) : '';
    const subject = stripHeaderBreaks(`Enquiry: ${product.title} (#${product.id})`);
    const text = [
      `Product: ${product.title} (#${product.id})`,
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || 'Not provided'}`,
      '',
      'Message:',
      input.message
    ].join('\n');

    try {
      await this.emailSender.send({
        to: this.salesInbox,
        from: this.mailFrom,
        subject,
        text,
        replyTo: email
      });
    } catch {
      throw new AppError(502, 'EMAIL_FAILED', 'Your enquiry could not be sent. Please try again.');
    }
  }
}

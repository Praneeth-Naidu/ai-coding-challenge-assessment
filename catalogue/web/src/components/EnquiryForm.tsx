import { useState, type FormEvent } from 'react';
import type { EnquiryBody } from '../api/types.js';

type FormValues = { name: string; email: string; phone: string; message: string; website: string };
type FieldErrors = Partial<Record<'name' | 'email' | 'message', string>>;

type EnquiryFormProps = {
  productId: number;
  productTitle: string;
  sending: boolean;
  apiError: string | null;
  sent: boolean;
  onSubmit: (body: EnquiryBody) => void;
};

export function EnquiryForm({ productId, productTitle, sending, apiError, sent, onSubmit }: EnquiryFormProps) {
  const [values, setValues] = useState<FormValues>({ name: '', email: '', phone: '', message: '', website: '' });
  const [errors, setErrors] = useState<FieldErrors>({});

  function update(field: keyof FormValues, value: string): void {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({
      name: field === 'name' ? undefined : current.name,
      email: field === 'email' ? undefined : current.email,
      message: field === 'message' ? undefined : current.message
    }));
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!values.name.trim() || values.name.trim().length > 100) next.name = 'Enter your name (up to 100 characters).';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) next.email = 'Enter a valid email address.';
    if (!values.message.trim() || values.message.trim().length > 1_000) next.message = 'Enter a message of up to 1,000 characters.';
    return next;
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      productId,
      name: values.name.trim(),
      email: values.email.trim(),
      ...(values.phone.trim() ? { phone: values.phone.trim() } : {}),
      message: values.message.trim(),
      website: values.website
    });
  }

  if (sent) return <p className="success-message" data-testid="enquiry-thank-you">Thank you, we'll be in touch.</p>;

  return (
    <section className="form-card" aria-labelledby="enquiry-heading">
      <h2 id="enquiry-heading">Ask us about this piece</h2>
      <p>Send a note about {productTitle}. Our team will reply by email.</p>
      <form className="form-stack" onSubmit={(event) => { void submit(event); }} noValidate>
        <div className="form-field">
          <label htmlFor="enquiry-name">Name</label>
          <input id="enquiry-name" data-testid="enquiry-name" value={values.name} maxLength={100}
            onChange={(event) => update('name', event.target.value)} aria-describedby={errors.name ? 'enquiry-name-error' : undefined} />
          {errors.name && <span id="enquiry-name-error" className="field-error">{errors.name}</span>}
        </div>
        <div className="form-field">
          <label htmlFor="enquiry-email">Email</label>
          <input id="enquiry-email" data-testid="enquiry-email" type="email" value={values.email}
            onChange={(event) => update('email', event.target.value)} aria-describedby={errors.email ? 'enquiry-email-error' : undefined} />
          {errors.email && <span id="enquiry-email-error" data-testid="enquiry-email-error" className="field-error">{errors.email}</span>}
        </div>
        <div className="form-field">
          <label htmlFor="enquiry-phone">Phone <span className="product-rating">(optional)</span></label>
          <input id="enquiry-phone" data-testid="enquiry-phone" type="tel" maxLength={30} value={values.phone}
            onChange={(event) => update('phone', event.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="enquiry-message">Message</label>
          <textarea id="enquiry-message" data-testid="enquiry-message" maxLength={1_000} value={values.message}
            onChange={(event) => update('message', event.target.value)} aria-describedby={errors.message ? 'enquiry-message-error' : undefined} />
          <span className="product-rating">{values.message.length}/1,000</span>
          {errors.message && <span id="enquiry-message-error" className="field-error">{errors.message}</span>}
        </div>
        <div className="honeypot" aria-hidden="true">
          <label htmlFor="enquiry-website">Website</label>
          <input id="enquiry-website" name="website" tabIndex={-1} autoComplete="off" value={values.website}
            onChange={(event) => update('website', event.target.value)} />
        </div>
        {apiError && <div role="alert" data-testid="enquiry-error" className="form-error">{apiError}</div>}
        <button className="button" data-testid="enquiry-submit" type="submit" disabled={sending}>
          {sending ? 'Sending…' : 'Send enquiry'}
        </button>
      </form>
    </section>
  );
}

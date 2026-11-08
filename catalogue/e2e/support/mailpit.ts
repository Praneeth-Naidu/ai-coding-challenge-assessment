import { expect } from '@playwright/test';

const mailpitUrl = process.env.MAILPIT_URL ?? 'http://localhost:8025';

type MailpitRecipient = { Address?: string };
export type MailpitSummary = { ID: string; Subject: string; To: MailpitRecipient[] };
type MailpitList = { messages?: MailpitSummary[] };

async function listMessages(): Promise<MailpitSummary[]> {
  const response = await fetch(`${mailpitUrl}/api/v1/messages?limit=100`);
  if (!response.ok) throw new Error(`Mailpit list failed with HTTP ${response.status}`);
  const payload = await response.json() as MailpitList;
  return payload.messages ?? [];
}

export async function clearInbox(): Promise<void> {
  const response = await fetch(`${mailpitUrl}/api/v1/messages`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`Mailpit inbox clear failed with HTTP ${response.status}`);
}

export async function waitForMessage(subjectContains: string): Promise<MailpitSummary> {
  let found: MailpitSummary | undefined;
  await expect.poll(async () => {
    const messages = await listMessages();
    found = messages.find((message) => message.Subject.includes(subjectContains));
    return found?.ID ?? null;
  }, { timeout: 10_000, intervals: [200, 500, 1_000] }).not.toBeNull();
  if (!found) throw new Error(`Mailpit did not receive a message containing: ${subjectContains}`);
  return found;
}

export async function getMessageText(id: string): Promise<string> {
  const response = await fetch(`${mailpitUrl}/api/v1/message/${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error(`Mailpit message read failed with HTTP ${response.status}`);
  const payload: unknown = await response.json();
  if (typeof payload !== 'object' || payload === null) return '';
  const record = payload as { Text?: string; TextBody?: string; HTML?: string; Snippet?: string };
  return [record.Text, record.TextBody, record.HTML, record.Snippet].filter(Boolean).join('\n');
}

export async function matchingSalesMessages(subjectContains: string, salesInbox: string): Promise<MailpitSummary[]> {
  const messages = await listMessages();
  return messages.filter((message) => message.Subject.includes(subjectContains)
    && message.To.some((recipient) => recipient.Address?.toLowerCase() === salesInbox.toLowerCase()));
}

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
export type ChatOptions = { json?: boolean };
export type ChatFunction = (messages: ChatMessage[], options?: ChatOptions) => Promise<string>;

type ChatCompletionResponse = { choices?: Array<{ message?: { content?: string | null } }> };

export function stripModelFormatting(value: string): string {
  return value
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .trim()
    .replace(/^```(?:json|typescript|ts)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

export function createChat(config: { baseUrl: string; model: string; apiKey: string; temperature: number }): ChatFunction {
  return async (messages, options = {}) => {
    let response: Response;
    try {
      response = await fetch(`${config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { authorization: `Bearer ${config.apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          messages,
          temperature: config.temperature,
          ...(options.json ? { response_format: { type: 'json_object' } } : {})
        }),
        signal: AbortSignal.timeout(120_000)
      });
    } catch (error) {
      throw new Error(`Local LLM server is unreachable at ${config.baseUrl}: ${error instanceof Error ? error.message : 'request failed'}`);
    }
    if (!response.ok) throw new Error(`Local LLM returned HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`);
    const payload = await response.json() as ChatCompletionResponse;
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) throw new Error('Local LLM returned an empty assistant response.');
    return stripModelFormatting(content);
  };
}

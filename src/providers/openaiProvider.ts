// Local, non-exported types to avoid altering public API
type ModelId = string;
type ChatRole = 'system' | 'user' | 'assistant' | 'tool' | 'developer';
type MessageContent = string | { type: string; text?: string; [k: string]: unknown };
interface ChatMessage { role: ChatRole; content: MessageContent; name?: string; metadata?: Record<string, unknown>; }
interface ChatParams { model: ModelId; messages: ChatMessage[]; [k: string]: unknown }
interface ChatChoice { index: number; message?: { role?: ChatRole; content?: string }; delta?: { content?: string }; finish_reason?: string | null }
interface ChatResult { id: string; model: ModelId; choices: ChatChoice[]; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } }
interface EmbeddingsResult { object: 'list'; data: { object?: 'embedding'; embedding: number[]; index: number }[]; model: ModelId; usage?: { prompt_tokens?: number; total_tokens?: number } }
import { httpPost } from '../utils/http';
import { getOpenAIKey } from '../utils/env';

const OPENAI_BASE = 'https://api.openai.com/v1';

export class OpenAIProvider {
  baseURL: string;
  headers: Record<string,string>;
  constructor(baseURL?: string) {
    this.baseURL = baseURL || OPENAI_BASE;
    const k = getOpenAIKey();
    if (!k) throw new Error('OPENAI_API_KEY missing');
    this.headers = { Authorization: `Bearer ${k}` };
  }

  async listModels(): Promise<any[]> {
    // Some keys may not allow; OpenAI supports GET but this repo uses POST shim elsewhere; keep chat/embeddings only
    try {
      const r = await fetch(`${this.baseURL}/models`, { headers: this.headers as any } as any);
      if (!r.ok) return [];
      const j = await r.json();
      return j.data || [];
    } catch { return []; }
  }

  async chat(params: ChatParams): Promise<ChatResult> {
    const res = await httpPost<ChatResult>(`${this.baseURL}/chat/completions`, params, this.headers);
    return res;
  }

  async embeddings(params: { model: string; input: string | string[]; }): Promise<EmbeddingsResult> {
    const res = await httpPost<EmbeddingsResult>(`${this.baseURL}/embeddings`, params, this.headers);
    return res;
  }

  async imagesGenerate(params: { model?: string; prompt: string; n?: number; size?: string }): Promise<{ url: string }[]> {
    const body = { model: params.model || 'dall-e-3', prompt: params.prompt, n: params.n || 1, size: params.size || '1024x1024' };
    const res = await httpPost<{ data: { url: string }[] }>(`${this.baseURL}/images/generations`, body, this.headers);
    return res.data || [];
  }

  async transcriptionsCreate(params: { model?: string; file: Blob | Buffer; }): Promise<{ text: string }> {
    const form = new FormData();
    form.append('model', params.model || 'whisper-1');
    const fileBlob = params.file instanceof Blob ? params.file : new Blob([params.file]);
    form.append('file', fileBlob, 'audio.wav');
    const r = await fetch(`${this.baseURL}/audio/transcriptions`, { method: 'POST', headers: this.headers as any, body: form as any } as any);
    if (!r.ok) throw new Error(`transcriptions failed ${r.status}`);
    const j = await r.json();
    return { text: j.text };
  }

  async moderationsCreate(params: { model?: string; input: string | string[] }): Promise<any> {
    const body = { model: params.model || 'omni-moderation-latest', input: params.input } as any;
    const res = await httpPost<any>(`${this.baseURL}/moderations`, body, this.headers);
    return res;
  }
}


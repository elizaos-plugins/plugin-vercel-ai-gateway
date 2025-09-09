// Local, non-exported types mirroring OpenAI-compatible shapes
type ModelId = string;
type ChatRole = 'system' | 'user' | 'assistant' | 'tool' | 'developer';
type MessageContent = string | { type: string; text?: string; [k: string]: unknown };
interface ChatMessage { role: ChatRole; content: MessageContent; name?: string; metadata?: Record<string, unknown>; }
interface ChatParams { model: ModelId; messages: ChatMessage[]; [k: string]: unknown }
interface ChatChoice { index: number; message?: { role?: ChatRole; content?: string }; delta?: { content?: string }; finish_reason?: string | null }
interface ChatResult { id: string; model: ModelId; choices: ChatChoice[]; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } }
interface EmbeddingsResult { object: 'list'; data: { object?: 'embedding'; embedding: number[]; index: number }[]; model: ModelId; usage?: { prompt_tokens?: number; total_tokens?: number } }
interface ModelListItem { id: string; object: 'model'; name?: string; description?: string; created?: number; owned_by?: string }
interface ModelListResponse { object: 'list'; data: ModelListItem[] }
import { httpGet, httpPost } from '../utils/http';
import { getGatewayBaseURL, getAuthHeader } from '../utils/env';

export class GatewayProvider {
  baseURL: string;
  headers: Record<string,string>;
  modelsCache: ModelListResponse['data'] | null = null;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || getGatewayBaseURL();
    this.headers = { Authorization: getAuthHeader('gateway') };
  }

  async listModels(force = false): Promise<ModelListResponse['data']> {
    if (this.modelsCache && !force) return this.modelsCache;
    const url = `${this.baseURL}/models`;
    const res = await httpGet<ModelListResponse>(url, this.headers);
    this.modelsCache = res.data || [];
    return this.modelsCache;
  }

  async chat(params: ChatParams): Promise<ChatResult> {
    try {
      if (params.model) {
        const models = await this.listModels(false);
        if (!models.some(m => m.id === params.model)) {
          console.warn(`Requested model ${params.model} not found in gateway list`);
        }
      }
    } catch {}
    const url = `${this.baseURL}/chat/completions`;
    const res = await httpPost<ChatResult>(url, params, this.headers);
    return res;
  }

  async embeddings(params: { model: string; input: string | string[]; }): Promise<EmbeddingsResult> {
    const url = `${this.baseURL}/embeddings`;
    const res = await httpPost<EmbeddingsResult>(url, params, this.headers);
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


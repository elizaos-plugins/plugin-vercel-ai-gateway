import { OpenAIProvider } from '../providers/openaiProvider';
import { GatewayProvider } from '../providers/gatewayProvider';

export class ModerationModel {
  provider: 'openai' | 'gateway';
  openai?: OpenAIProvider;
  gateway?: GatewayProvider;
  constructor(opts: { provider: 'openai' | 'gateway'; baseURL?: string; } ) {
    this.provider = opts.provider;
    if (this.provider === 'openai') this.openai = new OpenAIProvider(opts.baseURL);
    else this.gateway = new GatewayProvider(opts.baseURL);
  }

  async moderate(params: { model?: string; input: string | string[] }): Promise<any> {
    if (this.provider === 'openai') {
      return this.openai!.moderationsCreate(params);
    } else {
      return this.gateway!.moderationsCreate(params);
    }
  }
}


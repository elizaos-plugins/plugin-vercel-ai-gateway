import type {
  GenerateTextParams,
  IAgentRuntime,
  Plugin,
  TextEmbeddingParams,
} from '@elizaos/core';
import { EventType, logger, ModelType } from '@elizaos/core';
import { createGateway } from '@ai-sdk/gateway';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, embed, experimental_generateImage as generateImage } from 'ai';

/**
 * AI Gateway Plugin for ElizaOS
 * Provides access to OpenAI models via Vercel AI Gateway or directly via OpenAI
 */
export const aiGatewayPlugin: Plugin = {
  name: 'ai-gateway',
  description: 'AI Gateway plugin using @ai-sdk/gateway and OpenAI',

  models: {
    // Small text model - uses AI Gateway by default
    [ModelType.TEXT_SMALL]: async (
      runtime: IAgentRuntime,
      params: GenerateTextParams
    ): Promise<string> => {
      const apiKey = runtime.getSetting('AI_GATEWAY_API_KEY') || process.env.AI_GATEWAY_API_KEY;
      const openaiKey = runtime.getSetting('OPENAI_API_KEY') || process.env.OPENAI_API_KEY;
      
      const smallModel = runtime.getSetting('AI_GATEWAY_SMALL_MODEL') || 
                        process.env.AI_GATEWAY_SMALL_MODEL || 
                        'openai/gpt-4o-mini';

      try {
        let model;
        if (apiKey) {
          // Use AI Gateway
          const gatewayProvider = createGateway({ apiKey });
          model = gatewayProvider(smallModel);
        } else if (openaiKey) {
          // Fallback to direct OpenAI
          const openaiProvider = createOpenAI({ apiKey: openaiKey });
          model = openaiProvider(smallModel.replace('openai/', ''));
        } else {
          throw new Error('AI_GATEWAY_API_KEY or OPENAI_API_KEY is required');
        }

        const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
        
        if (runtime.character.system) {
          messages.push({
            role: 'system',
            content: runtime.character.system,
          });
        }

        messages.push({
          role: 'user',
          content: params.prompt,
        });

        const result = await generateText({
          model,
          prompt: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
          temperature: params.temperature ?? 0.7,
        });

        // Emit usage event
        if (result.usage) {
          runtime.emitEvent(EventType.MODEL_USED, {
            provider: apiKey ? 'ai-gateway' : 'openai',
            type: ModelType.TEXT_SMALL,
            prompt: params.prompt,
            tokens: {
              prompt: result.usage.inputTokens,
              completion: result.usage.outputTokens,
              total: result.usage.totalTokens,
            },
          });
        }

        return result.text;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`[AI Gateway] TEXT_SMALL error: ${message}`);
        throw error;
      }
    },

    // Large text model - uses AI Gateway by default
    [ModelType.TEXT_LARGE]: async (
      runtime: IAgentRuntime,
      params: GenerateTextParams
    ): Promise<string> => {
      const apiKey = runtime.getSetting('AI_GATEWAY_API_KEY') || process.env.AI_GATEWAY_API_KEY;
      const openaiKey = runtime.getSetting('OPENAI_API_KEY') || process.env.OPENAI_API_KEY;
      
      const largeModel = runtime.getSetting('AI_GATEWAY_LARGE_MODEL') || 
                        process.env.AI_GATEWAY_LARGE_MODEL || 
                        'openai/gpt-4o';

      try {
        let model;
        if (apiKey) {
          // Use AI Gateway
          const gatewayProvider = createGateway({ apiKey });
          model = gatewayProvider(largeModel);
        } else if (openaiKey) {
          // Fallback to direct OpenAI
          const openaiProvider = createOpenAI({ apiKey: openaiKey });
          model = openaiProvider(largeModel.replace('openai/', ''));
        } else {
          throw new Error('AI_GATEWAY_API_KEY or OPENAI_API_KEY is required');
        }

        const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
        
        if (runtime.character.system) {
          messages.push({
            role: 'system',
            content: runtime.character.system,
          });
        }

        messages.push({
          role: 'user',
          content: params.prompt,
        });

        const result = await generateText({
          model,
          prompt: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
          temperature: params.temperature ?? 0.7,
        });

        // Emit usage event
        if (result.usage) {
          runtime.emitEvent(EventType.MODEL_USED, {
            provider: apiKey ? 'ai-gateway' : 'openai',
            type: ModelType.TEXT_LARGE,
            prompt: params.prompt,
            tokens: {
              prompt: result.usage.inputTokens,
              completion: result.usage.outputTokens,
              total: result.usage.totalTokens,
            },
          });
        }

        return result.text;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`[AI Gateway] TEXT_LARGE error: ${message}`);
        throw error;
      }
    },

    // Text embeddings
    [ModelType.TEXT_EMBEDDING]: async (
      runtime: IAgentRuntime,
      params: TextEmbeddingParams | string | null
    ): Promise<number[]> => {
      const apiKey = runtime.getSetting('AI_GATEWAY_API_KEY') || process.env.AI_GATEWAY_API_KEY;
      const openaiKey = runtime.getSetting('OPENAI_API_KEY') || process.env.OPENAI_API_KEY;
      
      const embeddingModel = runtime.getSetting('AI_GATEWAY_EMBEDDING_MODEL') || 
                            process.env.AI_GATEWAY_EMBEDDING_MODEL || 
                            'openai/text-embedding-3-small';

      const text = typeof params === 'string' ? params : params?.text || '';
      if (!text) {
        throw new Error('Text is required for embeddings');
      }

      try {
        let embeddingModelInstance;
        if (apiKey) {
          // Use AI Gateway - gateway automatically handles embeddings
          const gatewayProvider = createGateway({ apiKey });
          embeddingModelInstance = gatewayProvider(embeddingModel) as any;
        } else if (openaiKey) {
          // Fallback to direct OpenAI
          const openaiProvider = createOpenAI({ apiKey: openaiKey });
          embeddingModelInstance = openaiProvider.embedding(embeddingModel.replace('openai/', ''));
        } else {
          throw new Error('AI_GATEWAY_API_KEY or OPENAI_API_KEY is required');
        }

        const result = await embed({
          model: embeddingModelInstance,
          value: text,
        });

        return result.embedding;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`[AI Gateway] TEXT_EMBEDDING error: ${message}`);
        throw error;
      }
    },

    // Image generation
    [ModelType.IMAGE]: async (
      runtime: IAgentRuntime,
      params: {
        prompt: string;
        n?: number;
        size?: string;
      }
    ): Promise<Array<{ url: string }>> => {
      const apiKey = runtime.getSetting('AI_GATEWAY_API_KEY') || process.env.AI_GATEWAY_API_KEY;
      const openaiKey = runtime.getSetting('OPENAI_API_KEY') || process.env.OPENAI_API_KEY;
      
      const imageModel = runtime.getSetting('AI_GATEWAY_IMAGE_MODEL') || 
                        process.env.AI_GATEWAY_IMAGE_MODEL || 
                        'openai/dall-e-3';

      try {
        let imageModelInstance;
        if (apiKey) {
          // Use AI Gateway - gateway automatically handles images
          const gatewayProvider = createGateway({ apiKey });
          imageModelInstance = gatewayProvider(imageModel) as any;
        } else if (openaiKey) {
          // Fallback to direct OpenAI
          const openaiProvider = createOpenAI({ apiKey: openaiKey });
          const modelId = imageModel.replace('openai/', '');
          imageModelInstance = openaiProvider.image(modelId);
        } else {
          throw new Error('AI_GATEWAY_API_KEY or OPENAI_API_KEY is required');
        }

        const sizeStr = params.size ?? '1024x1024';
        const sizeMatch = sizeStr.match(/^(\d+)x(\d+)$/);
        if (!sizeMatch) {
          throw new Error(`Invalid size format: ${sizeStr}. Expected format: WIDTHxHEIGHT`);
        }
        const size = sizeStr as `${number}x${number}`;

        const result = await generateImage({
          model: imageModelInstance,
          prompt: params.prompt,
          n: params.n ?? 1,
          size,
        });

        // Convert to expected format with URLs (base64 data URLs)
        return result.images.map((img) => ({
          url: img.base64 ? `data:${img.mediaType};base64,${img.base64}` : '',
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`[AI Gateway] IMAGE error: ${message}`);
        throw error;
      }
    },
  },
};

export default aiGatewayPlugin;
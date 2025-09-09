import type {
    DetokenizeTextParams,
    GenerateTextParams,
    IAgentRuntime,
    ImageDescriptionParams,
    ModelTypeName,
    ObjectGenerationParams,
    Plugin,
    TextEmbeddingParams,
    TokenizeTextParams,
  } from '@elizaos/core';
  import { EventType, logger, ModelType } from '@elizaos/core';
  import { encodingForModel, type TiktokenModel } from 'js-tiktoken';
  
  // Import handlers
  import { handleTextSmall, handleTextLarge } from './handlers/text.js';
  import { handleTextEmbedding } from './handlers/embedding.js';
  import { handleObjectSmall, handleObjectLarge } from './handlers/object.js';
  import { handleImageGeneration, handleImageDescription } from './handlers/image.js';
  import { handleTranscription } from './handlers/transcription.js';
  import { handleTextToSpeech } from './handlers/tts.js';
  
  // Import utilities
  import { getAIGatewayConfig, validateConfig } from './utils/config.ts';
  import { AIGatewayClient } from './utils/client.ts';
  
  /**
   * Tokenize text using tiktoken (similar to OpenAI plugin)
   */
  async function tokenizeText(model: ModelTypeName, prompt: string): Promise<number[]> {
    const modelName = model === ModelType.TEXT_SMALL 
      ? (process.env.AI_GATEWAY_SMALL_MODEL ?? '@cf/meta/llama-3.1-8b-instruct')
      : (process.env.AI_GATEWAY_LARGE_MODEL ?? '@cf/meta/llama-3.1-70b-instruct');
  
    // Use a compatible tiktoken model for tokenization
    const encoding = encodingForModel('gpt-4' as TiktokenModel);
    const tokens = encoding.encode(prompt);
    return tokens;
  }
  
  /**
   * Detokenize tokens back to text using tiktoken
   */
  async function detokenizeText(model: ModelTypeName, tokens: number[]): Promise<string> {
    const encoding = encodingForModel('gpt-4' as TiktokenModel);
    return encoding.decode(tokens);
  }
  
  /**
   * AI Gateway Plugin for ElizaOS
   */
  export const aiGatewayPlugin: Plugin = {
    name: 'ai-gateway',
    description: 'AI Gateway plugin with OpenAI compatible endpoints',
    config: {
      AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
      AI_GATEWAY_BASE_URL: process.env.AI_GATEWAY_BASE_URL,
      AI_GATEWAY_OPENAI_COMPATIBLE_URL: process.env.AI_GATEWAY_OPENAI_COMPATIBLE_URL,
      AI_GATEWAY_SMALL_MODEL: process.env.AI_GATEWAY_SMALL_MODEL,
      AI_GATEWAY_LARGE_MODEL: process.env.AI_GATEWAY_LARGE_MODEL,
      AI_GATEWAY_EMBEDDING_MODEL: process.env.AI_GATEWAY_EMBEDDING_MODEL,
      AI_GATEWAY_IMAGE_MODEL: process.env.AI_GATEWAY_IMAGE_MODEL,
      AI_GATEWAY_ACCOUNT_ID: process.env.AI_GATEWAY_ACCOUNT_ID,
      AI_GATEWAY_WORKSPACE: process.env.AI_GATEWAY_WORKSPACE,
    },
  
    async init(_config, runtime) {
      // Background initialization and validation
      new Promise<void>(async (resolve) => {
        resolve();
        try {
          const config = getAIGatewayConfig(runtime);
          validateConfig(config);
  
          const client = new AIGatewayClient(config);
          const isConnected = await client.testConnection();
  
          if (isConnected) {
            logger.log('[AI Gateway] Plugin initialized successfully');
          } else {
            logger.warn('[AI Gateway] Connection test failed - functionality may be limited');
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          logger.warn(`[AI Gateway] Plugin initialization issue: ${message}`);
        }
      });
    },
  
    models: {
      // Text embedding model
      [ModelType.TEXT_EMBEDDING]: async (
        runtime: IAgentRuntime,
        params: TextEmbeddingParams | string | null
      ): Promise<number[]> => {
        return handleTextEmbedding(runtime, params);
      },
  
      // Text tokenizer encode
      [ModelType.TEXT_TOKENIZER_ENCODE]: async (
        _runtime: IAgentRuntime,
        { prompt, modelType = ModelType.TEXT_LARGE }: TokenizeTextParams
      ): Promise<number[]> => {
        return tokenizeText(modelType ?? ModelType.TEXT_LARGE, prompt);
      },
  
      // Text tokenizer decode
      [ModelType.TEXT_TOKENIZER_DECODE]: async (
        _runtime: IAgentRuntime,
        { tokens, modelType = ModelType.TEXT_LARGE }: DetokenizeTextParams
      ): Promise<string> => {
        return detokenizeText(modelType ?? ModelType.TEXT_LARGE, tokens);
      },
  
      // Small text model
      [ModelType.TEXT_SMALL]: async (
        runtime: IAgentRuntime,
        params: GenerateTextParams
      ): Promise<string> => {
        return handleTextSmall(runtime, params);
      },
  
      // Large text model
      [ModelType.TEXT_LARGE]: async (
        runtime: IAgentRuntime,
        params: GenerateTextParams
      ): Promise<string> => {
        return handleTextLarge(runtime, params);
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
        return handleImageGeneration(runtime, params);
      },
  
      // Image description
      [ModelType.IMAGE_DESCRIPTION]: async (
        runtime: IAgentRuntime,
        params: ImageDescriptionParams | string
      ): Promise<string | { title: string; description: string }> => {
        return handleImageDescription(runtime, params);
      },
  
      // Audio transcription
      [ModelType.TRANSCRIPTION]: async (
        runtime: IAgentRuntime,
        audioBuffer: Buffer
      ): Promise<string> => {
        return handleTranscription(runtime, audioBuffer);
      },
  
      // Text to speech
      [ModelType.TEXT_TO_SPEECH]: async (
        runtime: IAgentRuntime,
        text: string
      ): Promise<ReadableStream | null> => {
        return handleTextToSpeech(runtime, text);
      },
  
      // Object generation - small model
      [ModelType.OBJECT_SMALL]: async (
        runtime: IAgentRuntime,
        params: ObjectGenerationParams
      ): Promise<any> => {
        return handleObjectSmall(runtime, params);
      },
  
      // Object generation - large model
      [ModelType.OBJECT_LARGE]: async (
        runtime: IAgentRuntime,
        params: ObjectGenerationParams
      ): Promise<any> => {
        return handleObjectLarge(runtime, params);
      },
    },
  
    tests: [
      {
        name: 'ai_gateway_plugin_tests',
        tests: [
          {
            name: 'ai_gateway_test_connection',
            fn: async (runtime: IAgentRuntime) => {
              const config = getAIGatewayConfig(runtime);
              const client = new AIGatewayClient(config);
              const isConnected = await client.testConnection();
  
              if (!isConnected) {
                throw new Error('Failed to connect to AI Gateway');
              }
  
              logger.log('[AI Gateway] Connection test passed');
            },
          },
          {
            name: 'ai_gateway_test_text_embedding',
            fn: async (runtime: IAgentRuntime) => {
              try {
                const embedding = await runtime.useModel(ModelType.TEXT_EMBEDDING, {
                  text: 'Hello, AI Gateway!',
                });
  
                if (!Array.isArray(embedding) || embedding.length === 0) {
                  throw new Error('Invalid embedding response');
                }
  
                logger.log({ embedding: embedding.slice(0, 5) }, 'AI Gateway embedding test');
              } catch (error: unknown) {
                const message = error instanceof Error ? error.message : String(error);
                logger.error(`Error in AI Gateway embedding test: ${message}`);
                throw error;
              }
            },
          },
          {
            name: 'ai_gateway_test_text_large',
            fn: async (runtime: IAgentRuntime) => {
              try {
                const text = await runtime.useModel(ModelType.TEXT_LARGE, {
                  prompt: 'What is artificial intelligence in 10 words?',
                });
  
                if (!text || text.length === 0) {
                  throw new Error('Failed to generate text');
                }
  
                logger.log({ text }, 'AI Gateway text generation test');
              } catch (error: unknown) {
                const message = error instanceof Error ? error.message : String(error);
                logger.error(`Error in AI Gateway text test: ${message}`);
                throw error;
              }
            },
          },
          {
            name: 'ai_gateway_test_text_small',
            fn: async (runtime: IAgentRuntime) => {
              try {
                const text = await runtime.useModel(ModelType.TEXT_SMALL, {
                  prompt: 'Say hello in 5 words.',
                });
  
                if (!text || text.length === 0) {
                  throw new Error('Failed to generate text');
                }
  
                logger.log({ text }, 'AI Gateway small text test');
              } catch (error: unknown) {
                const message = error instanceof Error ? error.message : String(error);
                logger.error(`Error in AI Gateway small text test: ${message}`);
                throw error;
              }
            },
          },
          {
            name: 'ai_gateway_test_object_generation',
            fn: async (runtime: IAgentRuntime) => {
              try {
                const obj = await runtime.useModel(ModelType.OBJECT_SMALL, {
                  prompt: 'Generate a person object with name and age properties',
                });
  
                if (!obj || typeof obj !== 'object') {
                  throw new Error('Failed to generate object');
                }
  
                logger.log({ obj }, 'AI Gateway object generation test');
              } catch (error: unknown) {
                const message = error instanceof Error ? error.message : String(error);
                logger.error(`Error in AI Gateway object test: ${message}`);
                throw error;
              }
            },
          },
        ],
      },
    ],
  };
  
  export default aiGatewayPlugin;
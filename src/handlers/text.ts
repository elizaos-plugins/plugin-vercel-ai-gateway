import type { IAgentRuntime, GenerateTextParams } from '@elizaos/core';
import { logger, EventType, ModelType } from '@elizaos/core';
import { AIGatewayClient } from '../utils/client.ts';
import { getAIGatewayConfig } from '../utils/config.ts';

interface ChatCompletionRequest {
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  stop?: string[];
  frequency_penalty?: number;
  presence_penalty?: number;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Generate text using AI Gateway small model
 */
export async function handleTextSmall(
  runtime: IAgentRuntime,
  params: GenerateTextParams
): Promise<string> {
  const config = getAIGatewayConfig(runtime);
  const client = new AIGatewayClient(config);

  logger.log(`[AI Gateway] Using TEXT_SMALL model: ${config.smallModel}`);
  logger.log(`[AI Gateway] Prompt: ${params.prompt}`);

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

  const requestBody: ChatCompletionRequest = {
    model: config.smallModel,
    messages,
    temperature: params.temperature ?? 0.7,
    max_tokens: params.max_tokens ?? 8192,
    frequency_penalty: params.frequencyPenalty ?? 0.7,
    presence_penalty: params.presencePenalty ?? 0.7,
  };

  if (params.stopSequences && params.stopSequences.length > 0) {
    requestBody.stop = params.stopSequences;
  }

  const response = await client.makeOpenAIRequest<ChatCompletionResponse>(
    '/chat/completions',
    requestBody
  );

  if (!response.success || !response.data) {
    throw new Error(`AI Gateway text generation failed: ${response.error}`);
  }

  const content = response.data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content in AI Gateway response');
  }

  // Emit usage event if available
  if (response.data.usage) {
    runtime.emitEvent(EventType.MODEL_USED, {
      provider: 'ai-gateway',
      type: ModelType.TEXT_SMALL,
      prompt: params.prompt,
      tokens: {
        prompt: response.data.usage.prompt_tokens,
        completion: response.data.usage.completion_tokens,
        total: response.data.usage.total_tokens,
      },
    });
  }

  return content;
}

/**
 * Generate text using AI Gateway large model
 */
export async function handleTextLarge(
  runtime: IAgentRuntime,
  params: GenerateTextParams
): Promise<string> {
  const config = getAIGatewayConfig(runtime);
  const client = new AIGatewayClient(config);

  logger.log(`[AI Gateway] Using TEXT_LARGE model: ${config.largeModel}`);
  logger.log(`[AI Gateway] Prompt: ${params.prompt}`);

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

  const requestBody: ChatCompletionRequest = {
    model: config.largeModel,
    messages,
    temperature: params.temperature ?? 0.7,
    max_tokens: params.max_tokens ?? 8192,
    frequency_penalty: params.frequencyPenalty ?? 0.7,
    presence_penalty: params.presencePenalty ?? 0.7,
  };

  if (params.stopSequences && params.stopSequences.length > 0) {
    requestBody.stop = params.stopSequences;
  }

  const response = await client.makeOpenAIRequest<ChatCompletionResponse>(
    '/chat/completions',
    requestBody
  );

  if (!response.success || !response.data) {
    throw new Error(`AI Gateway text generation failed: ${response.error}`);
  }

  const content = response.data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content in AI Gateway response');
  }

  // Emit usage event if available
  if (response.data.usage) {
    runtime.emitEvent(EventType.MODEL_USED, {
      provider: 'ai-gateway',
      type: ModelType.TEXT_LARGE,
      prompt: params.prompt,
      tokens: {
        prompt: response.data.usage.prompt_tokens,
        completion: response.data.usage.completion_tokens,
        total: response.data.usage.total_tokens,
      },
    });
  }

  return content;
}
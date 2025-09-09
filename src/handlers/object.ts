import type { IAgentRuntime, ObjectGenerationParams } from '@elizaos/core';
import { logger, EventType, ModelType } from '@elizaos/core';
import { AIGatewayClient } from '../utils/client.ts';
import { getAIGatewayConfig } from '../utils/config.ts';

interface ObjectGenerationRequest {
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  response_format?: {
    type: 'json_object';
  };
}

interface ObjectGenerationResponse {
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
 * Generate structured object using AI Gateway small model
 */
export async function handleObjectSmall(
  runtime: IAgentRuntime,
  params: ObjectGenerationParams
): Promise<any> {
  const config = getAIGatewayConfig(runtime);
  const client = new AIGatewayClient(config);

  logger.log(`[AI Gateway] Using OBJECT_SMALL model: ${config.smallModel}`);

  let prompt = params.prompt;

  // If schema is provided, add JSON schema instruction to prompt
  if (params.schema) {
    prompt += `\n\nPlease respond with a valid JSON object that matches this schema: ${JSON.stringify(params.schema, null, 2)}`;
  } else {
    prompt += '\n\nPlease respond with a valid JSON object.';
  }

  const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
    {
      role: 'system',
      content: 'You are a helpful assistant that always responds with valid JSON objects.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ];

  const requestBody: ObjectGenerationRequest = {
    model: config.smallModel,
    messages,
    temperature: params.temperature ?? 0,
    max_tokens: (() => {
      const specific = runtime.getSetting('OBJECT_SMALL_MAX_TOKENS');
      const fallback = runtime.getSetting('DEFAULT_MAX_TOKENS');
      const chosen = specific ?? fallback;
      const parsed = chosen ? parseInt(chosen, 10) : NaN;
      return Number.isFinite(parsed) ? parsed : 8192;
    })(),
    response_format: { type: 'json_object' },
  };

  const response = await client.makeOpenAIRequest<ObjectGenerationResponse>(
    '/chat/completions',
    requestBody
  );

  if (!response.success || !response.data) {
    throw new Error(`AI Gateway object generation failed: ${response.error}`);
  }

  const content = response.data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content in AI Gateway response');
  }

  // Parse JSON response
  let parsedObject: any;
  try {
    parsedObject = JSON.parse(content);
  } catch (error) {
    logger.error(`[AI Gateway] Failed to parse JSON response: ${content}`);
    throw new Error('Failed to parse JSON from AI Gateway response');
  }

  // Emit usage event if available
  if (response.data.usage) {
    runtime.emitEvent(EventType.MODEL_USED, {
      provider: 'ai-gateway',
      type: ModelType.OBJECT_SMALL,
      prompt: params.prompt,
      tokens: {
        prompt: response.data.usage.prompt_tokens,
        completion: response.data.usage.completion_tokens,
        total: response.data.usage.total_tokens,
      },
    });
  }

  return parsedObject;
}

/**
 * Generate structured object using AI Gateway large model
 */
export async function handleObjectLarge(
  runtime: IAgentRuntime,
  params: ObjectGenerationParams
): Promise<any> {
  const config = getAIGatewayConfig(runtime);
  const client = new AIGatewayClient(config);

  logger.log(`[AI Gateway] Using OBJECT_LARGE model: ${config.largeModel}`);

  let prompt = params.prompt;

  // If schema is provided, add JSON schema instruction to prompt
  if (params.schema) {
    prompt += `\n\nPlease respond with a valid JSON object that matches this schema: ${JSON.stringify(params.schema, null, 2)}`;
  } else {
    prompt += '\n\nPlease respond with a valid JSON object.';
  }

  const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
    {
      role: 'system',
      content: 'You are a helpful assistant that always responds with valid JSON objects.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ];

  const requestBody: ObjectGenerationRequest = {
    model: config.largeModel,
    messages,
    temperature: params.temperature ?? 0,
    max_tokens: (() => {
      const specific = runtime.getSetting('OBJECT_LARGE_MAX_TOKENS');
      const fallback = runtime.getSetting('DEFAULT_MAX_TOKENS');
      const chosen = specific ?? fallback;
      const parsed = chosen ? parseInt(chosen, 10) : NaN;
      return Number.isFinite(parsed) ? parsed : 8192;
    })(),
    response_format: { type: 'json_object' },
  };

  const response = await client.makeOpenAIRequest<ObjectGenerationResponse>(
    '/chat/completions',
    requestBody
  );

  if (!response.success || !response.data) {
    throw new Error(`AI Gateway object generation failed: ${response.error}`);
  }

  const content = response.data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content in AI Gateway response');
  }

  // Parse JSON response
  let parsedObject: any;
  try {
    parsedObject = JSON.parse(content);
  } catch (error) {
    logger.error(`[AI Gateway] Failed to parse JSON response: ${content}`);
    throw new Error('Failed to parse JSON from AI Gateway response');
  }

  // Emit usage event if available
  if (response.data.usage) {
    runtime.emitEvent(EventType.MODEL_USED, {
      provider: 'ai-gateway',
      type: ModelType.OBJECT_LARGE,
      prompt: params.prompt,
      tokens: {
        prompt: response.data.usage.prompt_tokens,
        completion: response.data.usage.completion_tokens,
        total: response.data.usage.total_tokens,
      },
    });
  }

  return parsedObject;
}
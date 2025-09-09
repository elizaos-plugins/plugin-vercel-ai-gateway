import type { IAgentRuntime, ImageDescriptionParams } from '@elizaos/core';
import { logger, EventType, ModelType } from '@elizaos/core';
import { AIGatewayClient } from '../utils/client.ts';
import { getAIGatewayConfig } from '../utils/config.ts';

interface ImageGenerationRequest {
  model: string;
  prompt: string;
  n?: number;
  size?: string;
}

interface ImageGenerationResponse {
  data: Array<{
    url: string;
  }>;
}

interface ImageDescriptionRequest {
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: Array<{
      type: 'text' | 'image_url';
      text?: string;
      image_url?: {
        url: string;
      };
    }>;
  }>;
  max_tokens?: number;
}

interface ImageDescriptionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Generate images using AI Gateway
 */
export async function handleImageGeneration(
  runtime: IAgentRuntime,
  params: {
    prompt: string;
    n?: number;
    size?: string;
  }
): Promise<Array<{ url: string }>> {
  const config = getAIGatewayConfig(runtime);
  const client = new AIGatewayClient(config);

  const n = params.n || 1;
  const size = params.size || '1024x1024';

  logger.log(`[AI Gateway] Using image generation model: ${config.imageModel}`);
  logger.log(`[AI Gateway] Prompt: ${params.prompt}`);

  const requestBody: ImageGenerationRequest = {
    model: config.imageModel,
    prompt: params.prompt,
    n,
    size,
  };

  const response = await client.makeOpenAIRequest<ImageGenerationResponse>(
    '/images/generations',
    requestBody
  );

  if (!response.success || !response.data) {
    throw new Error(`AI Gateway image generation failed: ${response.error}`);
  }

  const images = response.data.data;
  if (!images || !Array.isArray(images)) {
    throw new Error('Invalid image generation response format');
  }

  return images;
}

/**
 * Describe images using AI Gateway vision model
 */
export async function handleImageDescription(
  runtime: IAgentRuntime,
  params: ImageDescriptionParams | string
): Promise<string | { title: string; description: string }> {
  const config = getAIGatewayConfig(runtime);
  const client = new AIGatewayClient(config);

  let imageUrl: string;
  let promptText: string;

  if (typeof params === 'string') {
    imageUrl = params;
    promptText = 'Please analyze this image and provide a title and detailed description.';
  } else {
    imageUrl = params.imageUrl;
    promptText = params.prompt || 'Please analyze this image and provide a title and detailed description.';
  }

  // Use the large model for vision tasks (assuming it has vision capabilities)
  const modelName = config.largeModel;

  logger.log(`[AI Gateway] Using image description model: ${modelName}`);
  logger.log(`[AI Gateway] Image URL: ${imageUrl}`);

  const messages: Array<{
    role: 'user';
    content: Array<{
      type: 'text' | 'image_url';
      text?: string;
      image_url?: { url: string };
    }>;
  }> = [
    {
      role: 'user',
      content: [
        { type: 'text', text: promptText },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    },
  ];

  const requestBody: ImageDescriptionRequest = {
    model: modelName,
    messages,
    max_tokens: 8192,
  };

  const response = await client.makeOpenAIRequest<ImageDescriptionResponse>(
    '/chat/completions',
    requestBody
  );

  if (!response.success || !response.data) {
    logger.error(`[AI Gateway] Image description failed: ${response.error}`);
    return {
      title: 'Failed to analyze image',
      description: response.error || 'Unknown error',
    };
  }

  const content = response.data.choices?.[0]?.message?.content;
  if (!content) {
    return {
      title: 'Failed to analyze image',
      description: 'No response from API',
    };
  }

  // Emit usage event if available
  if (response.data.usage) {
    runtime.emitEvent(EventType.MODEL_USED, {
      provider: 'ai-gateway',
      type: ModelType.IMAGE_DESCRIPTION,
      prompt: typeof params === 'string' ? params : params.prompt || '',
      tokens: {
        prompt: response.data.usage.prompt_tokens,
        completion: response.data.usage.completion_tokens,
        total: response.data.usage.total_tokens,
      },
    });
  }

  // Check if a custom prompt was provided
  const isCustomPrompt =
    typeof params === 'object' &&
    params.prompt &&
    params.prompt !== 'Please analyze this image and provide a title and detailed description.';

  // If custom prompt is used, return the raw content
  if (isCustomPrompt) {
    return content;
  }

  // Otherwise, try to parse title and description
  const titleMatch = content.match(/title[:\s]+(.+?)(?:\n|$)/i);
  const title = titleMatch?.[1]?.trim() || 'Image Analysis';
  const description = content.replace(/title[:\s]+(.+?)(?:\n|$)/i, '').trim();

  return { title, description };
}
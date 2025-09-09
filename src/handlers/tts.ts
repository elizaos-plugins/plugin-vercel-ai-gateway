import type { IAgentRuntime } from '@elizaos/core';
import { logger } from '@elizaos/core';
import { AIGatewayClient } from '../utils/client.ts';
import { getAIGatewayConfig } from '../utils/config.ts';

interface TTSRequest {
  model: string;
  voice: string;
  input: string;
}

/**
 * Handle text-to-speech using AI Gateway
 */
export async function handleTextToSpeech(
  runtime: IAgentRuntime,
  text: string
): Promise<ReadableStream | null> {
  const config = getAIGatewayConfig(runtime);

  logger.log('[AI Gateway] Processing text-to-speech');

  if (!text || !text.trim()) {
    throw new Error('Text is required for TTS');
  }

  try {
    const url = config.openaiCompatibleUrl 
      ? `${config.openaiCompatibleUrl}/audio/speech`
      : `${config.baseUrl}/audio/speech`;

    const requestBody: TTSRequest = {
      model: 'tts-1', // Standard TTS model
      voice: 'nova', // Default voice
      input: text,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`TTS failed: ${response.statusText}`);
    }

    logger.log('[AI Gateway] TTS completed successfully');
    return response.body;

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[AI Gateway] TTS error: ${message}`);
    throw error;
  }
}
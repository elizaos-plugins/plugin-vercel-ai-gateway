import type { IAgentRuntime } from '@elizaos/core';
import { logger, EventType, ModelType } from '@elizaos/core';
import { AIGatewayClient } from '../utils/client.ts';
import { getAIGatewayConfig } from '../utils/config.ts';

interface TranscriptionResponse {
  text: string;
}

/**
 * Handle audio transcription using AI Gateway
 */
export async function handleTranscription(
  runtime: IAgentRuntime,
  audioBuffer: Buffer
): Promise<string> {
  const config = getAIGatewayConfig(runtime);
  const client = new AIGatewayClient(config);

  logger.log('[AI Gateway] Processing audio transcription');

  if (!audioBuffer || audioBuffer.length === 0) {
    throw new Error('Audio buffer is empty or invalid for transcription');
  }

  const formData = new FormData();
  formData.append('file', new Blob([audioBuffer]), 'audio.mp3');
  formData.append('model', 'whisper-1'); // Standard Whisper model

  try {
    const url = config.openaiCompatibleUrl 
      ? `${config.openaiCompatibleUrl}/audio/transcriptions`
      : `${config.baseUrl}/audio/transcriptions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`);
    }

    const data = await response.json() as TranscriptionResponse;

    if (!data.text) {
      throw new Error('No transcription text received');
    }

    logger.log(`[AI Gateway] Transcription completed: ${data.text.substring(0, 100)}...`);
    return data.text;

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[AI Gateway] Transcription error: ${message}`);
    throw error;
  }
}

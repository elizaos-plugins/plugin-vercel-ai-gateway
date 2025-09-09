import type { IAgentRuntime, TextEmbeddingParams } from '@elizaos/core';
import { logger, EventType, ModelType, VECTOR_DIMS } from '@elizaos/core';
import { AIGatewayClient } from '../utils/client.js';
import { getAIGatewayConfig } from '../utils/config.ts';

interface EmbeddingRequest {
  model: string;
  input: string;
}

interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
  }>;
  usage?: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

/**
 * Generate embeddings using AI Gateway
 */
export async function handleTextEmbedding(
  runtime: IAgentRuntime,
  params: TextEmbeddingParams | string | null
): Promise<number[]> {
  const config = getAIGatewayConfig(runtime);
  const embeddingDimension = 768; // Default dimension for most embedding models

  if (params === null) {
    logger.debug('[AI Gateway] Creating test embedding for initialization');
    const testVector = Array(embeddingDimension).fill(0);
    testVector[0] = 0.1;
    return testVector;
  }

  let text: string;
  if (typeof params === 'string') {
    text = params;
  } else if (typeof params === 'object' && params.text) {
    text = params.text;
  } else {
    logger.warn('[AI Gateway] Invalid input format for embedding');
    const fallbackVector = Array(embeddingDimension).fill(0);
    fallbackVector[0] = 0.2;
    return fallbackVector;
  }

  if (!text.trim()) {
    logger.warn('[AI Gateway] Empty text for embedding');
    const emptyVector = Array(embeddingDimension).fill(0);
    emptyVector[0] = 0.3;
    return emptyVector;
  }

  const client = new AIGatewayClient(config);

  logger.log(`[AI Gateway] Using embedding model: ${config.embeddingModel}`);
  logger.log(`[AI Gateway] Text: ${text.substring(0, 100)}...`);

  const requestBody: EmbeddingRequest = {
    model: config.embeddingModel,
    input: text,
  };

  const response = await client.makeOpenAIRequest<EmbeddingResponse>(
    '/embeddings',
    requestBody
  );

  if (!response.success || !response.data) {
    logger.error(`[AI Gateway] Embedding generation failed: ${response.error}`);
    const errorVector = Array(embeddingDimension).fill(0);
    errorVector[0] = 0.4;
    return errorVector;
  }

  const embedding = response.data.data?.[0]?.embedding;
  if (!embedding || !Array.isArray(embedding)) {
    logger.error('[AI Gateway] Invalid embedding response structure');
    const errorVector = Array(embeddingDimension).fill(0);
    errorVector[0] = 0.5;
    return errorVector;
  }

  // Emit usage event if available
  if (response.data.usage) {
    runtime.emitEvent(EventType.MODEL_USED, {
      provider: 'ai-gateway',
      type: ModelType.TEXT_EMBEDDING,
      prompt: text,
      tokens: {
        prompt: response.data.usage.prompt_tokens,
        completion: 0,
        total: response.data.usage.total_tokens,
      },
    });
  }

  logger.log(`[AI Gateway] Got valid embedding with length ${embedding.length}`);
  return embedding;
}
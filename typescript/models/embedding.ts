import type { IAgentRuntime, TextEmbeddingParams } from "@elizaos/core";
import { logger, MAX_EMBEDDING_TOKENS } from "@elizaos/core";
import { GatewayClient } from "../providers/client";
import { buildConfig, getEmbeddingDimensions, getEmbeddingModel } from "../utils/config";

export async function handleTextEmbedding(
  runtime: IAgentRuntime,
  params: TextEmbeddingParams | string | null
): Promise<number[]> {
  const config = buildConfig(runtime);
  const client = new GatewayClient(config);

  let text: string;
  if (params === null) {
    text = "test";
  } else if (typeof params === "string") {
    text = params;
  } else {
    text = params.text;
  }

  // Truncate to stay within embedding model token limits
  const maxChars = MAX_EMBEDDING_TOKENS * 4; // ~4 chars per token
  if (text.length > maxChars) {
    logger.warn(
      `[Vercel] Embedding input too long (~${Math.ceil(text.length / 4)} tokens), truncating to ~${MAX_EMBEDDING_TOKENS} tokens`
    );
    text = text.slice(0, maxChars);
  }

  const model = getEmbeddingModel(runtime);
  const dimensions = getEmbeddingDimensions(runtime);

  return client.createEmbedding({
    text,
    model,
    dimensions,
  });
}

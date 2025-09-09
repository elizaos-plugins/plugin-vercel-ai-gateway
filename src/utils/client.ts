import { logger } from '@elizaos/core';
import { fetch } from 'undici';
import type { AIGatewayConfig, GatewayResponse } from '../types.js';

export class AIGatewayClient {
  private config: AIGatewayConfig;

  constructor(config: AIGatewayConfig) {
    this.config = config;
  }

  /**
   * Make a request to the AI Gateway
   */
  async makeRequest<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
      useOpenAICompatible?: boolean;
    } = {}
  ): Promise<GatewayResponse<T>> {
    const {
      method = 'POST',
      body,
      headers = {},
      useOpenAICompatible = false,
    } = options;

    let url: string;

    if (useOpenAICompatible && this.config.openaiCompatibleUrl) {
      // Use OpenAI compatible endpoint
      url = `${this.config.openaiCompatibleUrl}${endpoint}`;
    } else {
      // Use standard AI Gateway endpoint
      if (this.config.accountId && this.config.workspace) {
        url = `${this.config.baseUrl}/${this.config.accountId}/${this.config.workspace}${endpoint}`;
      } else {
        url = `${this.config.baseUrl}${endpoint}`;
      }
    }

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      ...headers,
    };

    try {
      logger.debug(`[AI Gateway] Making request to: ${url}`);

      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      const responseText = await response.text();

      if (!response.ok) {
        logger.error(`[AI Gateway] Request failed: ${response.status} ${response.statusText}`);
        logger.error(`[AI Gateway] Response: ${responseText}`);

        return {
          success: false,
          error: `Request failed: ${response.status} ${response.statusText}`,
        };
      }

      let data: T;
      try {
        data = JSON.parse(responseText) as T;
      } catch (parseError) {
        const parseMsg = parseError instanceof Error ? parseError.message : String(parseError);
        logger.error('[AI Gateway] Failed to parse response as JSON:', parseMsg);
        return {
          success: false,
          error: 'Failed to parse response',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`[AI Gateway] Request error: ${message}`);

      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Make a request to OpenAI compatible endpoint
   */
  async makeOpenAIRequest<T>(
    endpoint: string,
    body: any,
    headers: Record<string, string> = {}
  ): Promise<GatewayResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body,
      headers,
      useOpenAICompatible: true,
    });
  }

  /**
   * Test connection to AI Gateway
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to access a simple endpoint to test connectivity
      const response = await this.makeRequest('/models', { method: 'GET' });
      return response.success;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error('[AI Gateway] Connection test failed:', msg);
      return false;
    }
  }
}
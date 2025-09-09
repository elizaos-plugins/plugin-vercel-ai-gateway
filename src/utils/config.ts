import type { IAgentRuntime } from '@elizaos/core';
import { logger } from '@elizaos/core';
import type { AIGatewayConfig } from '../types.js';

/**
 * Retrieves a configuration setting from the runtime, falling back to environment variables or a default value if not found.
 */
function getSetting(
  runtime: IAgentRuntime,
  key: string,
  defaultValue?: string
): string | undefined {
  return runtime.getSetting(key) ?? process.env[key] ?? defaultValue;
}

/**
 * Get AI Gateway configuration from runtime settings
 */
export function getAIGatewayConfig(runtime: IAgentRuntime): AIGatewayConfig {
  const apiKey = getSetting(runtime, 'AI_GATEWAY_API_KEY');
  if (!apiKey) {
    throw new Error('AI_GATEWAY_API_KEY is required');
  }

  const baseUrl = getSetting(
    runtime,
    'AI_GATEWAY_BASE_URL',
    'https://gateway.ai.cloudflare.com/v1'
  ) as string;

  const openaiCompatibleUrl = getSetting(runtime, 'AI_GATEWAY_OPENAI_COMPATIBLE_URL');
  const accountId = getSetting(runtime, 'AI_GATEWAY_ACCOUNT_ID');
  const workspace = getSetting(runtime, 'AI_GATEWAY_WORKSPACE');

  const smallModel = getSetting(
    runtime,
    'AI_GATEWAY_SMALL_MODEL',
    '@cf/meta/llama-3.1-8b-instruct'
  ) as string;

  const largeModel = getSetting(
    runtime,
    'AI_GATEWAY_LARGE_MODEL',
    '@cf/meta/llama-3.1-70b-instruct'
  ) as string;

  const embeddingModel = getSetting(
    runtime,
    'AI_GATEWAY_EMBEDDING_MODEL',
    '@cf/baai/bge-base-en-v1.5'
  ) as string;

  const imageModel = getSetting(
    runtime,
    'AI_GATEWAY_IMAGE_MODEL',
    '@cf/stabilityai/stable-diffusion-xl-base-1.0'
  ) as string;

  const config: AIGatewayConfig = {
    apiKey,
    baseUrl,
    openaiCompatibleUrl,
    accountId,
    workspace,
    smallModel,
    largeModel,
    embeddingModel,
    imageModel,
  };

  logger.debug('[AI Gateway] Configuration loaded:', JSON.stringify({
      baseUrl: config.baseUrl,
      smallModel: config.smallModel,
      largeModel: config.largeModel,
      embeddingModel: config.embeddingModel,
      imageModel: config.imageModel,
      hasApiKey: !!config.apiKey,
      hasOpenaiUrl: !!config.openaiCompatibleUrl,
      charAt: function (pos: number): string {
          throw new Error('Function not implemented.');
      },
      charCodeAt: function (index: number): number {
          throw new Error('Function not implemented.');
      },
      concat: function (...strings: string[]): string {
          throw new Error('Function not implemented.');
      },
      indexOf: function (searchString: string, position?: number): number {
          throw new Error('Function not implemented.');
      },
      lastIndexOf: function (searchString: string, position?: number): number {
          throw new Error('Function not implemented.');
      },
      localeCompare: function (that: string): number {
          throw new Error('Function not implemented.');
      },
      match: function (regexp: string | RegExp): RegExpMatchArray | null {
          throw new Error('Function not implemented.');
      },
      replace: function (searchValue: string | RegExp, replaceValue: string): string {
          throw new Error('Function not implemented.');
      },
      search: function (regexp: string | RegExp): number {
          throw new Error('Function not implemented.');
      },
      slice: function (start?: number, end?: number): string {
          throw new Error('Function not implemented.');
      },
      split: function (separator: string | RegExp, limit?: number): string[] {
          throw new Error('Function not implemented.');
      },
      substring: function (start: number, end?: number): string {
          throw new Error('Function not implemented.');
      },
      toLowerCase: function (): string {
          throw new Error('Function not implemented.');
      },
      toLocaleLowerCase: function (locales?: string | string[]): string {
          throw new Error('Function not implemented.');
      },
      toUpperCase: function (): string {
          throw new Error('Function not implemented.');
      },
      toLocaleUpperCase: function (locales?: string | string[]): string {
          throw new Error('Function not implemented.');
      },
      trim: function (): string {
          throw new Error('Function not implemented.');
      },
      length: 0,
      substr: function (from: number, length?: number): string {
          throw new Error('Function not implemented.');
      },
      codePointAt: function (pos: number): number | undefined {
          throw new Error('Function not implemented.');
      },
      includes: function (searchString: string, position?: number): boolean {
          throw new Error('Function not implemented.');
      },
      endsWith: function (searchString: string, endPosition?: number): boolean {
          throw new Error('Function not implemented.');
      },
      normalize: function (form: 'NFC' | 'NFD' | 'NFKC' | 'NFKD'): string {
          throw new Error('Function not implemented.');
      },
      repeat: function (count: number): string {
          throw new Error('Function not implemented.');
      },
      startsWith: function (searchString: string, position?: number): boolean {
          throw new Error('Function not implemented.');
      },
      anchor: function (name: string): string {
          throw new Error('Function not implemented.');
      },
      big: function (): string {
          throw new Error('Function not implemented.');
      },
      blink: function (): string {
          throw new Error('Function not implemented.');
      },
      bold: function (): string {
          throw new Error('Function not implemented.');
      },
      fixed: function (): string {
          throw new Error('Function not implemented.');
      },
      fontcolor: function (color: string): string {
          throw new Error('Function not implemented.');
      },
      fontsize: function (size: number): string {
          throw new Error('Function not implemented.');
      },
      italics: function (): string {
          throw new Error('Function not implemented.');
      },
      link: function (url: string): string {
          throw new Error('Function not implemented.');
      },
      small: function (): string {
          throw new Error('Function not implemented.');
      },
      strike: function (): string {
          throw new Error('Function not implemented.');
      },
      sub: function (): string {
          throw new Error('Function not implemented.');
      },
      sup: function (): string {
          throw new Error('Function not implemented.');
      },
      padStart: function (maxLength: number, fillString?: string): string {
          throw new Error('Function not implemented.');
      },
      padEnd: function (maxLength: number, fillString?: string): string {
          throw new Error('Function not implemented.');
      },
      trimEnd: function (): string {
          throw new Error('Function not implemented.');
      },
      trimStart: function (): string {
          throw new Error('Function not implemented.');
      },
      trimLeft: function (): string {
          throw new Error('Function not implemented.');
      },
      trimRight: function (): string {
          throw new Error('Function not implemented.');
      },
      matchAll: function (regexp: RegExp): RegExpStringIterator<RegExpExecArray> {
          throw new Error('Function not implemented.');
      },
      replaceAll: function (searchValue: string | RegExp, replaceValue: string): string {
          throw new Error('Function not implemented.');
      },
      at: function (index: number): string | undefined {
          throw new Error('Function not implemented.');
      },
      isWellFormed: function (): boolean {
          throw new Error('Function not implemented.');
      },
      toWellFormed: function (): string {
          throw new Error('Function not implemented.');
      },
      [Symbol.iterator]: function (): StringIterator<string> {
          throw new Error('Function not implemented.');
      }
  }));

  return config;
}

/**
 * Validate AI Gateway configuration
 */
export function validateConfig(config: AIGatewayConfig): void {
  if (!config.apiKey) {
    throw new Error('AI Gateway API key is required');
  }

  if (!config.baseUrl) {
    throw new Error('AI Gateway base URL is required');
  }

  logger.info('[AI Gateway] Configuration validated successfully');
}
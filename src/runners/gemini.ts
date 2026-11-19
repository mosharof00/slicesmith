import { GoogleGenAI } from '@google/genai';
import { BaseRunner, RunnerOptions, RunnerResult } from './types.js';
import { Logger } from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

export class GeminiRunner implements BaseRunner {
  name = 'gemini';
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  async run(systemPrompt: string, userPrompt: string, options?: RunnerOptions): Promise<RunnerResult> {
    const model = options?.model || 'gemini-2.5-pro';

    if (!this.ai) {
      // Fallback message if no API key is set yet
      Logger.warn(`GEMINI_API_KEY not found in environment. Mocking output for test/dry-run mode.`);
      return {
        output: `[DRY_RUN: Simulated execution by GeminiRunner for model ${model}]\nTask accepted.\nFiles verified.`,
        tokensIn: Math.ceil((systemPrompt.length + userPrompt.length) / 4),
        tokensOut: 50,
        cachedTokens: 0,
        model,
      };
    }

    try {
      const response = await this.ai.models.generateContent({
        model,
        contents: [
          { role: 'user', parts: [{ text: userPrompt }] }
        ],
        config: {
          systemInstruction: { parts: [{ text: systemPrompt }] },
          temperature: options?.temperature ?? 0.2,
          maxOutputTokens: options?.maxTokens,
        }
      });

      const outputText = response.text || '';
      const usage = response.usageMetadata;

      return {
        output: outputText,
        tokensIn: usage?.promptTokenCount || Math.ceil((systemPrompt.length + userPrompt.length) / 4),
        tokensOut: usage?.candidatesTokenCount || Math.ceil(outputText.length / 4),
        cachedTokens: usage?.cachedContentTokenCount || 0,
        model,
      };
    } catch (err: any) {
      Logger.error(`Gemini API execution error: ${err.message}`);
      throw err;
    }
  }
}


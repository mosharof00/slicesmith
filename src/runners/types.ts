export interface RunnerOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface RunnerResult {
  output: string;
  tokensIn: number;
  tokensOut: number;
  cachedTokens: number;
  model: string;
}

export interface BaseRunner {
  name: string;
  run(systemPrompt: string, userPrompt: string, options?: RunnerOptions): Promise<RunnerResult>;
}


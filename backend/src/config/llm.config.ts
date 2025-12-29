import { registerAs } from '@nestjs/config';

export default registerAs('llm', () => ({
  apiKey: process.env.OPENAI_API_KEY,
  baseUrl: process.env.OPENAI_BASE_URL,
  timeout: parseInt(process.env.OPENAI_TIMEOUT || '120000', 10),
  defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o',
}));

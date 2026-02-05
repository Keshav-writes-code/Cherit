import { model } from '@/lib/features/nlp/states.svelte';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

export function apply_ai_config(
  provider: string,
  api_key: string,
  model_id: string
) {
  switch (provider) {
    case 'google':
      const google = createGoogleGenerativeAI({ apiKey: api_key });
      model.data = google(model_id);
      break;
    case 'openai':
      const openai = createOpenAI({ apiKey: api_key });
      model.data = openai(model_id);
      break;
    case 'anthropic':
      const anthropic = createAnthropic({ apiKey: api_key });
      model.data = anthropic(model_id);
      break;

    default:
      break;
  }
}

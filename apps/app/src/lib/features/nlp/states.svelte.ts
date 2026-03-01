import type { LanguageModelV3 } from '@ai-sdk/provider';

export const model = $state<{ data: LanguageModelV3 | undefined }>({
  data: undefined,
});

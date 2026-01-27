// NOTE: The Svelte states that are shared amoung main section, sidebar section and App.svelte
import type { Node, GenericPath } from '@/types';

export const workspace_root_path: { data: GenericPath | undefined } = $state({
  data: undefined,
});

export const opened_filenode: { data: Node | undefined } = $state({
  data: undefined,
});

export const drawer_open: { data: boolean } = $state({ data: false });
export * from './domain_specific/';

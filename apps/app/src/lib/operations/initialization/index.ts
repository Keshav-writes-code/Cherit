import { persistent_states } from '@/lib/states/persistent/index.svelte';
import { load_recent_workspace } from '../workspace';
import { attach_window_listeners } from '../window_listeners';

export async function initialize_app() {
  await persistent_states.load();
  load_recent_workspace();
  attach_window_listeners();
}

import { LazyStore } from '@tauri-apps/plugin-store';
import type { Workspace } from '@/lib/types';

export const user_activity = new LazyStore('user_activity.json');
export let recent_workspaces: { data: Workspace[] } = $state({ data: [] });

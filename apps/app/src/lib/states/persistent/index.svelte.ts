import { invoke } from '@tauri-apps/api/core';
import { toast } from 'svelte-sonner';

type GenericPath = {
  path: string;
  document_top_tree_uri: string | null;
};

export type WorkspaceMetadata = {
  path: GenericPath;
  last_accessed: Date | string;
  recent_filenode_path: GenericPath | undefined;
};

type SyncConfig = {
  nick_name: string;
};

type AppConfig = {
  workspaces_metadata: WorkspaceMetadata[];
  sync_config: SyncConfig;
};

type AppSecureConfig = {
  llm_api: string;
};

export type AppPersistentState = {
  schema_version: number;
  app_config: AppConfig;
  secure: AppSecureConfig;
};

class PersistentState {
  states = $state<AppPersistentState>();
  async load() {
    try {
      this.states = await invoke('get_persistent_states');
      return this.states;
    } catch (e) {
      if (e instanceof Error) toast.error(e.message);
    }
  }
  async save() {
    await invoke('save_persistent_states', {
      states: this.states,
    });
  }
}
export const persistent_states = new PersistentState();

import { invoke } from '@tauri-apps/api/core';

type GenericPath = {
  path: string;
  document_top_tree_uri: string | null;
};

type WorkspaceMetadata = {
  last_accessed: Date;
  recent_file_node_path: GenericPath;
};

type AppConfig = {
  workspaces_metadata: WorkspaceMetadata[];
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
  states = $state<AppConfig>();
  async get() {
    this.states = await invoke('get_persistent_states');
    return this.states;
  }
  async update(patch: Partial<AppPersistentState>) {
    console.log('update');
    this.states = {
      ...(this.states ?? {}),
      ...patch,
    } as AppConfig;
    await invoke('save_persistent_states', {
      states: this.states,
    });
  }
}
export const persistent_states = new PersistentState();

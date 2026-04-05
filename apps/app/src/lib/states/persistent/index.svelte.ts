import { invoke } from '@tauri-apps/api/core';

type GenericPath = {
  path: string;
  document_top_tree_uri: string | null;
};

type WorkspaceMetadata = {
  last_accessed: Date;
  recent_file_node_path: GenericPath;
};

type PersistentStates = {
  recent_workspaces: WorkspaceMetadata[];
};

const data: PersistentStates = {
  recent_workspaces: [
    {
      last_accessed: new Date(),
      recent_file_node_path: {
        path: '/home/keshav/notes',
        document_top_tree_uri: null,
      },
    },
  ],
};

class PersistentState {
  states = $state<PersistentStates>();
  async get() {
    this.states = await invoke('get_persistent_states');
    return this.states;
  }
  async update(patch: Partial<PersistentStates>) {
    console.log('update');
    this.states = {
      ...(this.states ?? {}),
      ...patch,
    } as PersistentStates;
    await invoke('save_persistent_states', {
      state: data,
    });
  }
}
export const persistent_states = new PersistentState();

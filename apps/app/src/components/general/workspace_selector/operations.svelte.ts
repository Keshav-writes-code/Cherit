import {
  build_file_tree_from_fs,
  find_filenode_by_path,
} from '@/lib/file_system';
import { current_platform } from '@/lib/file_system';
import {
  opened_filenode,
  workspace_root_path,
} from '@/lib/global_states/index.svelte';
import { workspace_picker_dialog_open_state } from '@/components/general//workspace_selector/states.svelte';
import { type Workspace, type GenericPath } from '@/types';
import { LazyStore } from '@tauri-apps/plugin-store';
import { toast } from 'svelte-sonner';
import { AndroidFs } from 'tauri-plugin-android-fs-api';
import {
  file_tree,
  is_filetree_loading,
} from '@/components/sidebar_section/file_manager/states.svelte';

export const user_activity = new LazyStore('user_activity.json');
export let recent_workspaces: { data: Workspace[] } = $state({ data: [] });

// NOTE: Mainly updates only the UI States of the App
export async function update_workspace(
  old_workspace_root_path: string | undefined,
  new_workspace: Omit<Workspace, 'last_accessed'>
) {
  try {
    // Prerequisites
    workspace_picker_dialog_open_state.data = false;
    const { path, document_top_tree_uri, last_filenode_path } = new_workspace;
    if (old_workspace_root_path === path) return;
    reset_ui_states();

    // Actual Workspace Updation
    const generic_path: GenericPath = { path, document_top_tree_uri };
    workspace_root_path.data = generic_path;
    is_filetree_loading.data = true;
    file_tree.data = await build_file_tree_from_fs(generic_path);
    is_filetree_loading.data = false;
    update_opened_filenode(last_filenode_path, generic_path.path);
    if (current_platform == 'android') {
      await AndroidFs.persistUriPermission({
        uri: path,
        documentTopTreeUri: document_top_tree_uri,
      });
    }

    await touch_recent_workspaces(new_workspace);
  } catch (e) {
    reset_ui_states();
    toast.error('Error Opening Folder: \n' + e);
    workspace_picker_dialog_open_state.data = true;
  }
}

async function update_opened_filenode(
  last_filenode_path: Workspace['last_filenode_path'],
  root_path: string
) {
  if (!last_filenode_path || !file_tree.data) return;
  opened_filenode.data = find_filenode_by_path(
    file_tree.data,
    last_filenode_path,
    root_path
  );
}
// NOTE: Just update the last accessed time and nothing else
export async function touch_recent_workspaces(
  data: Omit<Workspace, 'last_accessed'>,
  { update_time = true }: { update_time?: boolean } = {}
) {
  const existing = recent_workspaces.data.find((v) => v.path === data.path);

  const processed = [
    {
      ...data,
      last_accessed:
        existing && !update_time ? existing.last_accessed : new Date(),
    },
    ...recent_workspaces.data.filter((v) => v.path !== data.path),
  ].slice(0, 10);

  recent_workspaces.data = processed;
  await user_activity.set('recent_paths', processed);
  await user_activity.save();
}
function reset_ui_states() {
  file_tree.data = undefined;
  opened_filenode.data = undefined;
  workspace_root_path.data = undefined;
}

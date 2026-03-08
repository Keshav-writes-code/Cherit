import {
  build_file_tree_from_fs,
  find_filenode_by_path,
} from '@/lib/operations/file_tree';
import {
  opened_filenode,
  pending_app_changes,
  recent_workspaces,
  user_activity,
  workspace_root_path,
} from '@/lib/states/';
import { root_folder_picker_dialog_state } from '@/components/general/root_folder_selector/states.svelte';
import { type Workspace, type GenericPath } from '@/lib/types/';
import { toast } from 'svelte-sonner';
import { AndroidFs } from 'tauri-plugin-android-fs-api';
import {
  file_tree,
  focused_subtree,
  is_filetree_loading,
} from '@/components/sidebar_section/file_manager/states.svelte';
import { watch } from '@tauri-apps/plugin-fs';
import { current_platform } from '@/lib/states';

// NOTE: Mainly updates only the UI States of the App
export async function update_workspace(
  old_workspace_root_path: string | undefined,
  new_workspace: Omit<Workspace, 'last_accessed'>
) {
  try {
    // Prerequisites
    root_folder_picker_dialog_state.open = false;
    const { path, document_top_tree_uri, last_filenode_path } = new_workspace;
    if (old_workspace_root_path === path) return;
    reset_ui_states();

    // Actual Workspace Updation
    const generic_path: GenericPath = { path, document_top_tree_uri };
    workspace_root_path.data = generic_path;
    is_filetree_loading.data = true;
    file_tree.data = await build_file_tree_from_fs(generic_path);
    watch(
      generic_path.path,
      async (e) => {
        // do nothing if all that happened is:
        // - a file was accessed
        // - a file's content was modified
        const event_type = e.type;
        if (
          typeof event_type == 'object' &&
          ('access' in event_type ||
            ('modify' in event_type && event_type.modify.kind !== 'rename'))
        )
          return;

        // check if this event was initiated by the app
        let is_app_initiated = false;
        for (const path of e.paths) {
          if (pending_app_changes.data.has(path)) {
            is_app_initiated = true;
            pending_app_changes.data.delete(path);
          }
        }
        if (is_app_initiated) return;

        console.log('Stuff CHanged', e);
        file_tree.data = await build_file_tree_from_fs(generic_path);
        focused_subtree.data = undefined;
      },
      {
        recursive: true,
        delayMs: 300,
      }
    );
    is_filetree_loading.data = false;
    update_opened_filenode(last_filenode_path, generic_path.path);
    if (current_platform == 'android') {
      await AndroidFs.persistPickerUriPermission({
        uri: path,
        documentTopTreeUri: document_top_tree_uri,
      });
    }

    await touch_recent_workspaces(new_workspace);
  } catch (e) {
    reset_ui_states();
    toast.error('Error Opening Folder: \n' + e);
    root_folder_picker_dialog_state.open = true;
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

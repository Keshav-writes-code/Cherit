import {
  build_file_tree_from_fs,
  find_filenode_by_path,
} from '@/lib/operations/file_tree';
import {
  opened_filenode,
  pending_app_changes,
  workspace_root_path,
} from '@/lib/states/session/';
import { toast } from 'svelte-sonner';
import { AndroidFs } from 'tauri-plugin-android-fs-api';
import {
  file_tree,
  focused_subtree,
  is_filetree_loading,
} from '@/components/sidebar_section/file_manager/states.svelte';
import { watch } from '@tauri-apps/plugin-fs';
import { current_platform } from '@/lib/states/session';
import { workspace_picker_dialog_open_state } from '@/components/general/workspace_selector/states.svelte';
import {
  persistent_states,
  type WorkspaceMetadata,
} from '@/lib/states/persistent/index.svelte';
import type { GenericPath } from '@/lib/types';

// NOTE: Mainly updates only the UI States of the App
export async function init_or_update_workspace(
  old_workspace: GenericPath | undefined,
  new_workspace: Omit<WorkspaceMetadata, 'last_accessed'>
) {
  try {
    // Prerequisites
    workspace_picker_dialog_open_state.data = false;
    const { path: workspace_path, recent_filenode_path } = new_workspace;
    if (old_workspace?.path === workspace_path.path) return;
    console.log('Passed the return');
    reset_ui_states();

    // Actual Workspace Updation
    workspace_root_path.data = workspace_path;
    is_filetree_loading.data = true;
    file_tree.data = await build_file_tree_from_fs(workspace_path);
    watch(
      workspace_path.path,
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
        file_tree.data = await build_file_tree_from_fs(workspace_path);
        focused_subtree.data = undefined;
      },
      {
        recursive: true,
        delayMs: 300,
      }
    );
    is_filetree_loading.data = false;
    update_opened_filenode(recent_filenode_path, workspace_path.path);
    if (current_platform == 'android') {
      await AndroidFs.persistPickerUriPermission({
        uri: workspace_path.path,
        documentTopTreeUri: workspace_path.document_top_tree_uri,
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
  filenode_path: WorkspaceMetadata['recent_filenode_path'],
  root_path: string
) {
  if (!filenode_path || !file_tree.data) return;
  opened_filenode.data = find_filenode_by_path(
    file_tree.data,
    filenode_path.path,
    root_path
  );
}
// NOTE: Just update the last accessed time and nothing else
export async function touch_recent_workspaces(
  workspace: Omit<WorkspaceMetadata, 'last_accessed'>,
  { update_time = true }: { update_time?: boolean } = {}
) {
  if (!persistent_states.states) return;
  const existing = persistent_states.states.app_config.workspaces_metadata.find(
    (v) => v.path === workspace.path
  );

  const rest_of_the_workspaces =
    persistent_states.states.app_config.workspaces_metadata.filter(
      (v) => v.path.path !== workspace.path.path
    );

  const merged_workspaces = [
    {
      ...workspace,
      last_accessed:
        existing && !update_time ? existing.last_accessed : new Date(),
    },
    ...rest_of_the_workspaces,
  ];

  const sliced_workspaces = merged_workspaces.slice(0, 10);

  persistent_states.states.app_config.workspaces_metadata = sliced_workspaces;
  await persistent_states.save();

  // await user_activity.set('recent_paths', processed);
  // await user_activity.save();
}
function reset_ui_states() {
  file_tree.data = undefined;
  opened_filenode.data = undefined;
  workspace_root_path.data = undefined;
}

export function get_most_recent_workspace(
  items: WorkspaceMetadata[]
): WorkspaceMetadata | undefined {
  return items.reduce<WorkspaceMetadata | undefined>((latest, cur) => {
    if (!latest) return cur;
    return new Date(cur.last_accessed).getTime() >
      new Date(latest.last_accessed).getTime()
      ? cur
      : latest;
  }, undefined);
}

export function load_recent_workspace() {
  if (
    !persistent_states.states ||
    !persistent_states.states.app_config.workspaces_metadata.length
  ) {
    workspace_picker_dialog_open_state.data = true;
    return;
  }

  const recent_workspace = get_most_recent_workspace(
    persistent_states.states.app_config.workspaces_metadata
  );
  if (!recent_workspace) {
    workspace_picker_dialog_open_state.data = true;
    return;
  }

  init_or_update_workspace(undefined, { ...recent_workspace });
}

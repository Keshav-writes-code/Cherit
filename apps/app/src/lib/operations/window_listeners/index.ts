import { getCurrentWindow } from '@tauri-apps/api/window';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { opened_filenode, workspace_root_path } from '@/lib/states/';
import {
  editor_view,
  is_contents_changed,
} from '@/components/main_section/text_editor/editor_state.svelte';
import { touch_recent_workspaces } from '../workspace';
import { invoke } from '@tauri-apps/api/core';

export async function attach_window_listeners() {
  const unlistenFocus = await getCurrentWindow().onFocusChanged(
    ({ payload: focused }) => {
      if (!focused) on_window_blur();
    }
  );
  return () => {
    unlistenFocus();
  };
}

async function on_window_blur() {
  // Update recent paths
  if (!workspace_root_path.data) return;
  await touch_recent_workspaces({
    path: workspace_root_path.data?.path,
    document_top_tree_uri: workspace_root_path.data?.document_top_tree_uri,
    last_filenode_path: opened_filenode.data?.path,
  });
  if (opened_filenode.data && editor_view.data && is_contents_changed) {
    await writeTextFile(
      opened_filenode.data.path,
      editor_view.data.state.doc.toString()
    );

    // Trigger sync if enabled
    try {
      await invoke('sync_file', { filePath: opened_filenode.data.path });
    } catch (e) {
      console.warn('Failed to trigger sync: ', e);
    }
  }
}

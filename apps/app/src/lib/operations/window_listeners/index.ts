import { getCurrentWindow } from '@tauri-apps/api/window';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { opened_filenode, workspace_root_path } from '@/lib/states/session/';
import {
  editor_view,
  is_contents_changed,
} from '@/components/main_section/text_editor/editor_state.svelte';
import { touch_recent_workspaces } from '../workspace';
import type { GenericPath } from '@/lib/types';

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
  const recent_filenode_path: GenericPath | undefined =
    opened_filenode.data && {
      path: opened_filenode.data.path,
      document_top_tree_uri: null,
    };

  await touch_recent_workspaces({
    path: {
      path: workspace_root_path.data?.path,
      document_top_tree_uri: workspace_root_path.data?.document_top_tree_uri,
    },
    recent_filenode_path,
  });
  if (opened_filenode.data && editor_view.data && is_contents_changed) {
    await writeTextFile(
      opened_filenode.data.path,
      editor_view.data.state.doc.toString()
    );
  }
}

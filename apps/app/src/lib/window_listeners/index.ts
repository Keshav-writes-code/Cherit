import { touch_recent_workspaces } from '@/components/general/root_folder_selector/operations.svelte';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { opened_filenode, root_path } from '../states';

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

function on_window_blur() {
  // Update recent paths
  if (!root_path.data) return;
  touch_recent_workspaces({
    path: root_path.data?.path,
    document_top_tree_uri: root_path.data?.document_top_tree_uri,
    last_filenode_path: opened_filenode.data?.path,
  });
}

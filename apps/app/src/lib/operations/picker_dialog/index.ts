import { open } from '@tauri-apps/plugin-dialog';
import type { GenericPath } from '@/lib/types/';
import { AndroidFs } from 'tauri-plugin-android-fs-api';
import { current_platform } from '@/lib/states/session/domain_specific/os.svelte';

export async function show_folder_picker(): Promise<GenericPath> {
  let path: GenericPath;
  if (current_platform == 'android') {
    const uri = await AndroidFs.showOpenDirPicker();
    if (!uri) throw new Error('No folder selected');
    path = { path: uri.uri, document_top_tree_uri: uri.documentTopTreeUri };
  } else {
    const folder = await open({
      multiple: false,
      directory: true,
      recursive: true,
    });
    if (!folder) throw new Error('No folder selected');
    path = { path: folder, document_top_tree_uri: null };
  }
  return path;
}

import {
  create,
  mkdir,
  readDir,
  rename,
  type DirEntry,
} from '@tauri-apps/plugin-fs';
import { type FileNode, type GenericPath } from '@/types';
import { current_platform } from '@/misc_global_states.svelte';
import {
  AndroidFs,
  type AndroidEntryMetadataWithUri,
} from 'tauri-plugin-android-fs-api';
import { join } from '@tauri-apps/api/path';
import * as Logic from './file_tree_logic';

// Re-export pure logic functions
export * from './file_tree_logic';

// --- Platform / IO Adapters ---

export async function build_file_tree_from_fs(
  path: GenericPath
): Promise<FileNode[]> {
  const fetcher: Logic.NodeFetcher = async (p: GenericPath) => {
    let entries: DirEntry[] | AndroidEntryMetadataWithUri[];
    if (current_platform == 'android') {
      if (!p.document_top_tree_uri)
        throw new Error('Document top tree URI is not set');
      entries = await AndroidFs.readDir({
        uri: p.path,
        documentTopTreeUri: p.document_top_tree_uri,
      });
      return Logic.transform_android_entries_to_filenode(entries, p.path);
    } else {
      entries = await readDir(p.path);
      return Logic.transform_entries_to_filenode(entries, p.path, join);
    }
  };

  return Logic.build_tree_recursive(path, fetcher);
}

// Wrapper for backward compatibility if needed, or used by other components expecting this signature
export async function transform_entries_to_filenode(
    entries: DirEntry[],
    base_dir_path: string
  ): Promise<FileNode[]> {
      return Logic.transform_entries_to_filenode(entries, base_dir_path, join);
  }

export async function move_node(
  node: FileNode,
  new_parent_path: string,
  tree: FileNode[]
) {
  const new_path = new_parent_path
    ? `${new_parent_path}/${node.name}`
    : node.name;

  await rename(node.path, new_path);

  Logic.update_tree_after_move(tree, node, new_parent_path, new_path);
}

export async function add_new_note(
  tree: FileNode[],
  focused_path: string,
  { path: root_path, document_top_tree_uri }: GenericPath
) {
  const name = Logic.find_unused_name(tree, focused_path, 'Untitled', '.md', false);
  let new_file_path;

  if (current_platform == 'android') {
     await AndroidFs.createNewFile(
      { uri: focused_path, documentTopTreeUri: document_top_tree_uri },
      `${name}.md`,
      'plain/text'
    );
    new_file_path = focused_path + encodeURIComponent(`/${name}.md`);
  } else {
    await create(`${focused_path}/${name}.md`);
    new_file_path = `${focused_path}/${name}.md`;
  }

  Logic.insert_node_in_place(
    tree,
    {
      name,
      path: new_file_path,
      is_directory: false,
      children: [],
    },
    root_path,
    current_platform == 'android'
  );
}

export async function add_new_folder(
  tree: FileNode[],
  focused_path: string,
  { path: root_path, document_top_tree_uri }: GenericPath
) {
  const name = Logic.find_unused_name(tree, focused_path, 'Untitled', '', true);
  let new_file_path;

  if (current_platform == 'android') {
    await AndroidFs.createDirAll(
      { uri: focused_path, documentTopTreeUri: document_top_tree_uri },
      name
    );
    new_file_path = focused_path + encodeURIComponent(`/${name}`);
  } else {
    await mkdir(`${focused_path}/${name}`);
    new_file_path = `${focused_path}/${name}`;
  }

  Logic.insert_node_in_place(
    tree,
    {
      name,
      path: new_file_path,
      is_directory: true,
      children: [],
    },
    root_path,
    current_platform == 'android'
  );
}

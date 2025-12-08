import {
  create,
  mkdir,
  rename,
} from '@tauri-apps/plugin-fs';
import { type FileNode, type GenericPath } from '@/types';
import { current_platform } from '@/misc_global_states.svelte';
import { AndroidFs } from 'tauri-plugin-android-fs-api';
import * as Logic from './file_tree_logic';

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

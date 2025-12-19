import { create, mkdir, rename } from '@tauri-apps/plugin-fs';
import { type FileNode, type GenericPath } from '@/types';
import { AndroidFs } from 'tauri-plugin-android-fs-api';
import {
  current_platform,
  find_unused_name,
  join_path,
  sort_nodes,
} from './utils';

export async function move_node(
  node: FileNode,
  new_parent_path: string,
  tree: FileNode[]
) {
  const new_path = new_parent_path
    ? join_path(new_parent_path, node.name)
    : node.name;

  await rename(node.path, new_path);

  const remove = (list: FileNode[]) => {
    const i = list.findIndex((n) => n === node);
    if (i > -1) list.splice(i, 1);
    else list.forEach((n) => remove(n.children));
  };
  remove(tree);

  const update = (n: FileNode, p: string) => {
    n.path = p;
    n.children.forEach((c) => update(c, join_path(p, c.name)));
  };
  update(node, new_path);

  if (!new_parent_path) tree.push(node);
  else {
    const find = (list: FileNode[]): FileNode | undefined => {
      for (const n of list) {
        if (n.path === new_parent_path) return n;
        const res = find(n.children);
        if (res) return res;
      }
    };
    find(tree)?.children.push(node);
  }
}

export async function add_new_note(
  subtree: FileNode[],
  focused_path: string,
  { document_top_tree_uri }: GenericPath
) {
  let name = find_unused_name('Untitled', subtree, false);
  let new_file_path;
  if (current_platform == 'android') {
    await AndroidFs.createNewFile(
      { uri: focused_path, documentTopTreeUri: document_top_tree_uri },
      `${name}.md`,
      'plain/text'
    );
    new_file_path = focused_path + encodeURIComponent(`/${name}.md`);
  } else {
    new_file_path = join_path(focused_path, name + '.md');
    await create(new_file_path);
  }
  subtree.push({
    name,
    path: new_file_path,
    is_directory: false,
    children: [],
  });
  sort_nodes(subtree);
  const node = subtree.find((n) => n.path === new_file_path);
  if (!node) throw new Error('Failed to find the newly created note node.');
  return node;
}
export async function add_new_folder(
  subtree: FileNode[],
  focused_path: string,
  { document_top_tree_uri }: GenericPath
) {
  let name = find_unused_name('Untitled', subtree, true);
  let new_file_path;

  if (current_platform == 'android') {
    await AndroidFs.createDirAll(
      { uri: focused_path, documentTopTreeUri: document_top_tree_uri },
      name
    );
    new_file_path = focused_path + encodeURIComponent(`/${name}`);
  } else {
    new_file_path = join_path(focused_path, name);
    await mkdir(new_file_path);
  }
  subtree.push({
    name,
    path: new_file_path,
    is_directory: true,
    children: [],
  });
  sort_nodes(subtree);
}

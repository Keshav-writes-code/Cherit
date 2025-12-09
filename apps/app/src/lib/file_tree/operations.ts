import { create, mkdir, rename } from '@tauri-apps/plugin-fs';
import { type FileNode, type GenericPath } from '@/types';
import { current_platform } from '@/misc_global_states.svelte';
import { AndroidFs } from 'tauri-plugin-android-fs-api';
import { exists, find_unused_name } from './utils';

export function insert_node_in_place(
  roots: FileNode[],
  new_node: FileNode,
  offset: string = ''
): FileNode {
  const rel_path = new_node.path.startsWith(offset)
    ? new_node.path.slice(offset.length)
    : new_node.path;
  const parts = rel_path
    .split(/(?:%2F|[/\\])/)
    .filter(Boolean)
    .slice(0, -1);
  let level = roots;
  let current_path = offset.replace(/(?:%2F|[/\\])+$/, '');
  for (const part of parts) {
    if (current_platform === 'android') {
      current_path += '%2F' + encodeURIComponent(decodeURIComponent(part));
    } else if (current_platform === 'windows') {
      current_path += '\\' + part;
    } else {
      current_path += '/' + part;
    }

    let node = level.find(
      (n) => n.is_directory && n.name === decodeURIComponent(part)
    );
    if (!node)
      level.push(
        (node = {
          name: decodeURIComponent(part),
          path: current_path,
          is_directory: true,
          children: [],
        })
      );
    level = node.children;
  }
  level.push(new_node);
  return new_node;
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

  const remove = (list: FileNode[]) => {
    const i = list.findIndex((n) => n === node);
    if (i > -1) list.splice(i, 1);
    else list.forEach((n) => remove(n.children));
  };
  remove(tree);

  const update = (n: FileNode, p: string) => {
    n.path = p;
    n.children.forEach((c) => update(c, `${p}/${c.name}`));
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
  tree: FileNode[],
  focused_path: string,
  { path: root_path, document_top_tree_uri }: GenericPath
) {
  let name = find_unused_name('Untitled', focused_path, root_path, tree, false);
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
  insert_node_in_place(
    tree,
    {
      name,
      path: new_file_path,
      is_directory: false,
      children: [],
    },
    root_path
  );
}
export async function add_new_folder(
  tree: FileNode[],
  focused_path: string,
  { path: root_path, document_top_tree_uri }: GenericPath
) {
  let name = find_unused_name('Untitled', focused_path, root_path, tree, true);
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
  insert_node_in_place(
    tree,
    {
      name,
      path: new_file_path,
      is_directory: true,
      children: [],
    },
    root_path
  );
}

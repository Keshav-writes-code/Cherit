import { create, mkdir, remove, rename } from '@tauri-apps/plugin-fs';
import { type Node, type GenericPath } from '@/types';
import { AndroidFs } from 'tauri-plugin-android-fs-api';
import { invoke } from '@tauri-apps/api/core';
import {
  current_platform,
  find_unused_name,
  get_parent_path,
  get_relative_path_parts,
  join_path,
  sort_nodes,
} from './utils';
import { toast } from 'svelte-sonner';

export function find_filenode_by_path(
  tree: Node[],
  path: string,
  root_path: string
): Node | undefined {
  const parts = get_relative_path_parts(path, root_path);
  let current_level = tree;
  let found_node: Node | undefined;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const is_last = i === parts.length - 1;
    const part_name = part.endsWith('.md') ? part.slice(0, -3) : part;

    found_node = current_level.find((n) => {
      if (n.name !== part_name) return false;
      return is_last ? !n.is_directory : n.is_directory;
    });

    if (!found_node) return undefined;
    current_level = found_node.children;
  }

  return found_node;
}

export async function move_node(
  node: Node,
  new_parent_path: string,
  tree: Node[],
  document_top_tree_uri: string | null
) {
  let new_path = '';

  if (current_platform === 'android') {
    try {
      new_path = await invoke('move_file_android', {
        uri: node.path,
        newParentUri: new_parent_path,
        documentTopTreeUri: document_top_tree_uri,
      });
    } catch (e) {
      console.error(e);
      toast.error('Error Moving File', { description: String(e) });
      return;
    }
  } else {
    new_path = new_parent_path
      ? join_path(new_parent_path, node.name)
      : node.name;
    await rename(node.path, new_path);
  }

  const remove = (list: Node[]) => {
    const i = list.findIndex((n) => n === node);
    if (i > -1) list.splice(i, 1);
    else list.forEach((n) => remove(n.children));
  };
  remove(tree);

  const update = (n: Node, p: string) => {
    n.path = p;
    // For Android, children paths might need full reconstruction if they were path-based strings.
    // However, build_tree_recursive_android constructs them as parent + encoded_name.
    // If we have the new parent path, we can update children recursively.
    // The rust backend only returns the new path for the moved node itself.
    // We can assume the same pattern:
    if (current_platform === 'android') {
      n.children.forEach((c) =>
        update(
          c,
          p + '%2F' + encodeURIComponent(c.is_directory ? c.name : c.name + '.md')
        )
      );
    } else {
      n.children.forEach((c) => update(c, join_path(p, c.name)));
    }
  };
  update(node, new_path);

  if (!new_parent_path) tree.push(node);
  else {
    const find = (list: Node[]): Node | undefined => {
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
  subtree: Node[],
  focused_path: string,
  { document_top_tree_uri }: GenericPath
) {
  try {
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
  } catch (e) {
    console.error(e);
    if (e instanceof Error)
      toast.error('Error Creating Note', { description: e.message });
    else if (typeof e == 'string') {
      toast.error('Error Creating Note', { description: e });
    }
  }
}
export async function add_new_folder(
  subtree: Node[],
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

export async function rename_file(
  file_node: Node,
  new_name: string,
  parent_tree: Node[],
  document_top_tree_uri: string | null
) {
  if (current_platform === 'android') {
    try {
      const new_path = await invoke<string>('rename_file_android', {
        uri: file_node.path,
        newName: new_name + '.md',
        documentTopTreeUri: document_top_tree_uri,
      });
      file_node.name = new_name;
      file_node.path = new_path;
    } catch (e) {
      console.error(e);
      toast.error('Error Renaming File', { description: String(e) });
      return;
    }
  } else {
    const parent = get_parent_path(file_node.path);
    const new_path = join_path(parent, new_name + '.md');
    await rename(file_node.path, new_path);
    file_node.name = new_name;
    file_node.path = new_path;
  }
  sort_nodes(parent_tree);
}

export async function delete_node(
  node: Node,
  { document_top_tree_uri }: GenericPath,
  parent_tree: Node[]
) {
  try {
    if (current_platform === 'android') {
      if (node.is_directory) {
        await AndroidFs.removeDirAll({
          uri: node.path,
          documentTopTreeUri: document_top_tree_uri,
        });
      } else {
        await AndroidFs.removeFile({
          uri: node.path,
          documentTopTreeUri: document_top_tree_uri,
        });
      }
    } else {
      await remove(node.path, { recursive: node.is_directory });
    }
    const index = parent_tree.findIndex((v) => v == node);
    parent_tree.splice(index, 1);
  } catch (error) {
    toast.error('Error Deleting File: \n' + error);
  }
}

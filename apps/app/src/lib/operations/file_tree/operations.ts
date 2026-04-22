import { create, mkdir, remove, rename } from '@tauri-apps/plugin-fs';
import { type Node, type GenericPath } from '@/lib/types/';
import { AndroidFs } from 'tauri-plugin-android-fs-api';
import { invoke } from '@tauri-apps/api/core';
import { pending_app_changes, current_platform } from '@/lib/states/session';
import {
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
      if (node.is_directory) {
        new_path = await invoke('move_directory_android', {
          uri: node.path,
          newParentUri: new_parent_path,
          documentTopTreeUri: document_top_tree_uri,
        });
      } else {
        new_path = await invoke('move_file_android', {
          uri: node.path,
          newParentUri: new_parent_path,
          documentTopTreeUri: document_top_tree_uri,
        });
      }
      pending_app_changes.data.add(node.path);
      pending_app_changes.data.add(new_path);
    } catch (e) {
      console.error(e);
      toast.error('Error Moving Node', { description: String(e) });
      return;
    }
  } else {
    new_path = new_parent_path
      ? join_path(new_parent_path, node.name + (node.is_directory ? '' : '.md'))
      : node.name;
    const name_with_ext = node.is_directory ? node.name : node.name + '.md';
    new_path = new_parent_path
      ? join_path(new_parent_path, name_with_ext)
      : name_with_ext;

    pending_app_changes.data.add(node.path);
    pending_app_changes.data.add(new_path);
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
    if (current_platform === 'android') {
      n.children.forEach((c) =>
        update(
          c,
          p +
            '%2F' +
            encodeURIComponent(c.is_directory ? c.name : c.name + '.md')
        )
      );
    } else {
      n.children.forEach((c) => update(c, join_path(p, c.name))); // This assumes c.name doesn't have extension, but join_path might need to know?
    }
  };
  const update_recursive = (n: Node, p: string) => {
    n.path = p;
    if (current_platform === 'android') {
      n.children.forEach((c) =>
        update_recursive(
          c,
          p +
            '%2F' +
            encodeURIComponent(c.is_directory ? c.name : c.name + '.md')
        )
      );
    } else {
      n.children.forEach((c) => {
        const c_name = c.is_directory ? c.name : c.name + '.md';
        update_recursive(c, join_path(p, c_name));
      });
    }
  };

  update_recursive(node, new_path);

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
      pending_app_changes.data.add(new_file_path);
    } else {
      new_file_path = join_path(focused_path, name + '.md');
      pending_app_changes.data.add(new_file_path);
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
    pending_app_changes.data.add(new_file_path);
  } else {
    new_file_path = join_path(focused_path, name);
    pending_app_changes.data.add(new_file_path);
    await mkdir(new_file_path);
  }
  subtree.push({
    name,
    path: new_file_path,
    is_directory: true,
    children: [],
  });
  sort_nodes(subtree);
  const node = subtree.find((n) => n.path == new_file_path);
  if (!node) throw new Error('Node not found');
  return node;
}

export async function rename_node({
  node,
  new_name,
  parent_subtree,
  document_top_tree_uri,
}: {
  node: Node;
  new_name: string;
  parent_subtree: Node[];
  document_top_tree_uri: string | null;
}) {
  // Append .md if it's a file
  const final_name = node.is_directory ? new_name : new_name + '.md';
  if (parent_subtree.some((n) => n.name == new_name))
    throw new Error(
      `the ${node.is_directory ? 'Folder' : 'Note'} : "${new_name}" already exists in focused folder`
    );

  if (current_platform === 'android') {
    try {
      let new_path = '';
      if (node.is_directory) {
        ({ uri: new_path } = await AndroidFs.renameDir(
          { uri: node.path, documentTopTreeUri: document_top_tree_uri },
          final_name
        ));
      } else {
        ({ uri: new_path } = await AndroidFs.renameFile(
          { uri: node.path, documentTopTreeUri: document_top_tree_uri },
          final_name
        ));
      }

      pending_app_changes.data.add(node.path);
      pending_app_changes.data.add(new_path);

      // Update node
      node.name = new_name;

      // Update paths recursively using the same logic as move_node
      const update_recursive = (n: Node, p: string) => {
        n.path = p;
        n.children.forEach((c) =>
          update_recursive(
            c,
            p +
              '%2F' +
              encodeURIComponent(c.is_directory ? c.name : c.name + '.md')
          )
        );
      };
      update_recursive(node, new_path);
    } catch (e) {
      console.error(e);
      toast.error('Error Renaming Node', { description: String(e) });
      return;
    }
  } else {
    const parent = get_parent_path(node.path);
    const new_path = join_path(parent, final_name);
    try {
      pending_app_changes.data.add(node.path);
      pending_app_changes.data.add(new_path);
      await rename(node.path, new_path);

      node.name = new_name;

      const update_recursive = (n: Node, p: string) => {
        n.path = p;
        n.children.forEach((c) => {
          const c_name = c.is_directory ? c.name : c.name + '.md';
          update_recursive(c, join_path(p, c_name));
        });
      };
      update_recursive(node, new_path);
    } catch (e) {
      console.error(e);
      toast.error('Error Renaming Node', { description: String(e) });
      return;
    }
  }
  sort_nodes(parent_subtree);
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
      pending_app_changes.data.add(node.path);
    } else {
      pending_app_changes.data.add(node.path);
      await remove(node.path, { recursive: node.is_directory });
    }
    const index = parent_tree.findIndex((v) => v == node);
    parent_tree.splice(index, 1);
  } catch (error) {
    toast.error('Error Deleting File: \n' + error);
  }
}

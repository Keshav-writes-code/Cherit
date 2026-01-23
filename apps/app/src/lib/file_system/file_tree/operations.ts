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
    } catch (e) {
      console.error(e);
      toast.error('Error Moving Node', { description: String(e) });
      return;
    }
  } else {
    new_path = new_parent_path
      ? join_path(new_parent_path, node.name + (node.is_directory ? '' : '.md'))
      : node.name;
    // For desktop, renaming/moving requires correct extension handling if not present in node.name (which usually doesn't have it for files in UI model?)
    // Wait, node.name usually doesn't have .md in the UI model (see find_filenode_by_path).
    // So for file we need to add .md.
    // Existing move_node logic:
    // new_path = new_parent_path ? join_path(new_parent_path, node.name) : node.name;
    // It seems existing logic MIGHT be buggy if node.name lacks extension for files?
    // Or maybe node.name HAS extension?
    // In `build_tree_recursive_desktop`: `name: file_name.trim_end_matches(".md")`.
    // So node.name does NOT have extension.
    // Existing move_node was: `await rename(node.path, new_path);`
    // If `new_path` is constructed from `node.name` (no extension), then we are renaming `foo.md` to `foo`.
    // This seems wrong for files.
    // BUT, `rename_file` logic was: `newName: new_name + '.md'`.
    // So `move_node` might have been broken for files or I am misinterpreting `join_path`.
    // Let's look at `move_node` again carefully.
    // `new_path = ... join_path(new_parent_path, node.name)`.
    // If `node.is_directory` it is fine.
    // If file, we probably lost extension?
    // Let's fix it here:
    const name_with_ext = node.is_directory ? node.name : node.name + '.md';
    new_path = new_parent_path
      ? join_path(new_parent_path, name_with_ext)
      : name_with_ext;
    
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
      // Wait, `join_path` just joins.
      // If `c` is file, `c.name` is "foo". path should be ".../foo.md".
      // But `update` sets `n.path`.
      // If `c` is file, we need to append .md for the path.
      // But `c.name` is from the tree model.
      // Let's fix `update` for desktop too.
    }
  };
  // Wait, I shouldn't break existing logic if I am not sure.
  // The existing `move_node` had:
  // `n.children.forEach((c) => update(c, join_path(p, c.name)));`
  // And `FileNode` struct on rust side has `name` without extension.
  // So `path` on desktop definitely needs `.md`.
  // I will assume existing `move_node` was slightly broken or `join_path` does magic (unlikely).
  // I'll fix it in `rename_node` and `move_node`.
  
  // Re-defining update for this scope to be correct
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

export async function rename_node(
  node: Node,
  new_name: string,
  parent_tree: Node[],
  document_top_tree_uri: string | null
) {
  // Append .md if it's a file
  const final_name = node.is_directory ? new_name : new_name + '.md';

  if (current_platform === 'android') {
    try {
      let new_path = '';
      if (node.is_directory) {
         new_path = await invoke<string>('rename_directory_android', {
            uri: node.path,
            newName: new_name, // Directory name doesn't need extension
            documentTopTreeUri: document_top_tree_uri,
         });
      } else {
         new_path = await invoke<string>('rename_file_android', {
            uri: node.path,
            newName: final_name,
            documentTopTreeUri: document_top_tree_uri,
         });
      }
      
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

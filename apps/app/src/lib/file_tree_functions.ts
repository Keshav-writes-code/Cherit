import {
  create,
  mkdir,
  readDir,
  rename,
  type DirEntry,
} from '@tauri-apps/plugin-fs';
import { type FileNode } from '@/types';
import {
  current_platform,
  document_top_tree_uri,
} from '@/misc_global_states.svelte';
import {
  AndroidFs,
  type AndroidEntryMetadataWithUri,
} from 'tauri-plugin-android-fs-api';
import { join } from '@tauri-apps/api/path';

export async function build_file_tree_from_fs(
  dir_path: string
): Promise<FileNode[]> {
  let entries: DirEntry[] | AndroidEntryMetadataWithUri[] | undefined;
  let base_nodes: FileNode[] | undefined;

  if (current_platform == 'android') {
    if (!document_top_tree_uri.uri)
      throw new Error('Document top tree URI is not set');
    entries = await AndroidFs.readDir({
      uri: dir_path,
      documentTopTreeUri: document_top_tree_uri.uri,
    });
    base_nodes = await transform_android_entries_to_filenode(entries, dir_path);
  } else {
    entries = await readDir(dir_path);
    base_nodes = await transform_entries_to_filenode(entries, dir_path);
  }

  const nodes = await Promise.all(
    base_nodes.map(async (n) => {
      if (!n.is_directory) return n;
      const children = await build_file_tree_from_fs(n.path);
      return {
        ...n,
        children,
      };
    })
  );

  return nodes;
}
export async function transform_entries_to_filenode(
  entries: DirEntry[],
  base_dir_path: string
): Promise<FileNode[]> {
  const nodes = await Promise.all(
    entries
      .filter(
        (entry) =>
          (entry.isDirectory && !entry.name.startsWith('.')) ||
          entry.name.endsWith('.md')
      )
      .map(async (entry) => ({
        name: entry.name.replace(/\.md$/, ''),
        path: await join(base_dir_path, entry.name),
        is_directory: entry.isDirectory,
        children: [],
      }))
  );
  return nodes;
}
export async function transform_android_entries_to_filenode(
  entries: AndroidEntryMetadataWithUri[],
  base_dir_path: string
): Promise<FileNode[]> {
  const nodes = await Promise.all(
    entries
      .filter(
        (entry) =>
          (entry.type === 'Dir' && !entry.name.startsWith('.')) ||
          entry.name.endsWith('.md')
      )
      .map(async (entry) => ({
        name: entry.name.replace(/\.md$/, ''),
        path: `${base_dir_path}%2F${encodeURIComponent(entry.name)}`,
        is_directory: entry.type === 'Dir',
        children: [],
      }))
  );
  return nodes;
}

export function sort_file_tree(nodes: FileNode[]): FileNode[] {
  // Sort array in-place
  nodes.sort((a, b) => {
    if (a.is_directory !== b.is_directory) return a.is_directory ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  });

  // Recursively sort children in-place
  for (const node of nodes) {
    if (node.children?.length) {
      sort_file_tree(node.children);
    }
  }

  return nodes;
}
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
    current_path += '/' + part;
    let node = level.find(
      (n) => n.is_directory && n.name === decodeURIComponent(part)
    );
    if (!node)
      level.push(
        (node = {
          name: part,
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
  root_path: string
) {
  let i = 0;
  let name = 'Untitled';
  let new_file_path;
  if (current_platform == 'android') {
    while (exists(tree, focused_path + encodeURIComponent(`/${name}.md`)))
      name = `Untitled ${++i}`;
    await AndroidFs.createNewFile(
      { uri: focused_path, documentTopTreeUri: get_parent_path(focused_path) },
      `${name}.md`,
      'plain/text'
    );
    new_file_path = focused_path + encodeURIComponent(`/${name}.md`);
  } else {
    while (exists(tree, `${focused_path}/${name}.md`)) name = `Untitled ${++i}`;
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
  root_path: string
) {
  let i = 0;
  let name = 'Untitled';
  let new_file_path;
  if (current_platform == 'android') {
    while (exists(tree, focused_path + encodeURIComponent(`/${name}`), true))
      name = `Untitled ${++i}`;
    await AndroidFs.createDirAll(
      { uri: focused_path, documentTopTreeUri: get_parent_path(focused_path) },
      name
    );
    new_file_path = focused_path + encodeURIComponent(`/${name}`);
  } else {
    while (exists(tree, `${focused_path}/${name}`, true))
      name = `Untitled ${++i}`;
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
export const get_parent_path = (p: string) => {
  const s = p.startsWith('content://') ? '%2F' : '/';
  const c = p.endsWith(s) ? p.slice(0, -s.length) : p;
  return c.slice(0, Math.max(0, c.lastIndexOf(s))) || (s === '/' ? '/' : '');
};

export const exists = (
  file_tree: FileNode[],
  p: string,
  _is_directory: boolean = false
): boolean => {
  const stack = [...file_tree];
  while (stack.length > 0) {
    const n = stack.pop();
    if (!n) continue;
    if (n.path === p) return true;
    if (n.children?.length) stack.push(...n.children);
  }
  return false;
};

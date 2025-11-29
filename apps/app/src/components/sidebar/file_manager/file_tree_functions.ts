import { create, readDir, rename } from '@tauri-apps/plugin-fs';
import { type FileNode, type RootPath } from '@/types';
import { current_platform } from '@/misc_global_states.svelte';
import { AndroidFs } from 'tauri-plugin-android-fs-api';
import type { AndroidFsUri } from 'tauri-plugin-android-fs-api';

export async function build_file_tree_from_fs(
  dirPath: string
): Promise<FileNode[]> {
  const entries = await readDir(dirPath);

  const nodes = await Promise.all(
    entries
      .filter(
        (entry) =>
          (entry.isDirectory && !entry.name.startsWith('.')) ||
          entry.name.endsWith('.md')
      )
      .map(async (entry) => ({
        name: entry.name.replace(/\.md$/, ''),
        path: `${dirPath}/${entry.name}`,
        isDirectory: entry.isDirectory,
        children: entry.isDirectory
          ? await build_file_tree_from_fs(`${dirPath}/${entry.name}`)
          : [],
      }))
  );

  return nodes;
}
export async function build_file_tree_from_fs_android(
  dirPath: string
): Promise<FileNode[]> {
  const entries = await AndroidFs.readDir({
    uri: dirPath,
    documentTopTreeUri: get_parent_path(dirPath),
  });
  return Promise.all(
    entries
      .filter(
        (e) =>
          (e.type === 'Dir' && !e.name.startsWith('.')) ||
          e.name.endsWith('.md')
      )
      .map(async (e) => ({
        name: e.name.replace(/\.md$/, ''),
        path: e.uri.uri,
        isDirectory: e.type === 'Dir',
        children:
          e.type === 'Dir'
            ? await build_file_tree_from_fs_android(e.uri.uri)
            : [],
      }))
  );
}

export async function build_file_tree_cross_platform(
  dirPath: string
): Promise<FileNode[]> {
  if (current_platform == 'android') {
    return await build_file_tree_from_fs_android(dirPath);
  } else {
    return await build_file_tree_from_fs(dirPath);
  }
}

export function sort_file_tree(nodes: FileNode[]): FileNode[] {
  // Sort array in-place
  nodes.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
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
  const offset_str = offset.toString();
  const rel_path = new_node.path.startsWith(offset_str)
    ? new_node.path.slice(offset_str.length)
    : new_node.path;
  const parts = rel_path
    .split(/(?:%2F|[/\\])/)
    .filter(Boolean)
    .slice(0, -1);
  let level = roots;
  let current_path = offset_str.replace(/(?:%2F|[/\\])+$/, '');
  for (const part of parts) {
    current_path += '/' + part;
    let node = level.find((n) => n.isDirectory && n.name === part);
    if (!node)
      level.push(
        (node = {
          name: part,
          path: current_path,
          isDirectory: true,
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
  if (current_platform == 'android') {
    while (exists(tree, focused_path + encodeURIComponent(`/${name}.md`)))
      name = `Untitled ${++i}`;
    AndroidFs.createNewFile(
      { uri: focused_path, documentTopTreeUri: get_parent_path(focused_path) },
      `${name}.md`,
      'plain/text'
    );
    insert_node_in_place(
      tree,
      {
        name,
        path: focused_path + encodeURIComponent(`/${name}.md`),
        isDirectory: false,
        children: [],
      },
      root_path
    );
  } else {
    while (exists(tree, `${focused_path}/${name}.md`)) name = `Untitled ${++i}`;
    create(`${focused_path}/${name}.md`);
  }
}

export const get_parent_path = (p: string) => {
  const s = p.startsWith('content://') ? '%2F' : '/';
  const c = p.endsWith(s) ? p.slice(0, -s.length) : p;
  return c.slice(0, Math.max(0, c.lastIndexOf(s))) || (s === '/' ? '/' : '');
};
export const exists = (file_tree: FileNode[], p: string) =>
  file_tree.some(function f(n) {
    return n.path === p || n.children?.some(f);
  });

import { readDir, type DirEntry } from '@tauri-apps/plugin-fs';
import { type FileNode } from '@/types';
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
  dirPath: AndroidFsUri
): Promise<FileNode[]> {
  const entries = await AndroidFs.readDir(dirPath);

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
          e.type === 'Dir' ? await build_file_tree_from_fs_android(e.uri) : [],
      }))
  );
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
  offset: string | URL = ''
): FileNode {
  // Normalize offset to string (handles URL objects)
  const offset_str = offset.toString();

  const rel_path = new_node.path.startsWith(offset_str)
    ? new_node.path.slice(offset_str.length)
    : new_node.path;

  // Use generic regex to handle both forward and backslashes
  const parts = rel_path.split(/[/\\]/).filter(Boolean).slice(0, -1);

  let level = roots;
  // Strip trailing slashes from the base path for consistent concatenation
  let current_path = offset_str.replace(/[/\\]+$/, '');

  for (const part of parts) {
    current_path += '/' + part;
    let node = level.find((n) => n.isDirectory && n.name === part);

    if (!node) {
      level.push(
        (node = {
          name: part, // Note: You might want decodeURIComponent(part) here for UI display
          path: current_path,
          isDirectory: true,
          children: [],
        })
      );
    }

    level = node.children;
  }

  level.push(new_node);
  return new_node;
}
export const get_parent_path = (p: string) =>
  p.split('/').slice(0, -1).join('/');
export const exists = (file_tree: FileNode[], p: string) =>
  file_tree.some(function f(n) {
    return n.path === p || n.children?.some(f);
  });

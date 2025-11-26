import { readDir, type DirEntry } from '@tauri-apps/plugin-fs';
import { type FileNode } from '@/types';
import { current_platform } from '@/misc_global_states.svelte';
import { AndroidFs } from 'tauri-plugin-android-fs-api';
import type {
  AndroidEntryMetadataWithUri,
  AndroidFsUri,
} from 'tauri-plugin-android-fs-api';

export async function build_file_tree_from_fs(
  dirPath: string | AndroidFsUri
): Promise<FileNode[]> {
  let entries: (DirEntry | AndroidEntryMetadataWithUri)[];

  // 1. Fetch entries based on platform
  if (current_platform == 'android') {
    if (typeof dirPath === 'string')
      throw new Error('Android platform requires AndroidFsUri, not string');
    entries = await AndroidFs.readDir(dirPath);
  } else {
    if (typeof dirPath !== 'string') {
      throw new Error('Desktop platform requires a string path');
    }
    entries = await readDir(dirPath);
  }

  // 2. Helper to check directory status safely across both types
  const isEntryDirectory = (entry: DirEntry | AndroidEntryMetadataWithUri) => {
    // Check if it's the standard Tauri DirEntry
    if ('isDirectory' in entry) {
      return entry.isDirectory;
    }
    // Otherwise it is Android Metadata which uses 'type'
    return entry.type === 'Dir';
  };

  const nodes = await Promise.all(
    entries
      .filter((entry) => {
        const isDir = isEntryDirectory(entry);
        return (
          (isDir && !entry.name.startsWith('.')) || entry.name.endsWith('.md')
        );
      })
      .map(async (entry) => {
        const isDir = isEntryDirectory(entry);

        let nextPathForRecursion: string | AndroidFsUri;
        let pathStringForUi: string;

        if ('uri' in entry) {
          // Android: The entry already contains the URI for itself
          nextPathForRecursion = entry.uri;
          pathStringForUi = entry.uri.uri; // Extract string representation for UI/FileNode
        } else {
          // Desktop: Construct string path manually
          const combined = `${dirPath}/${entry.name}`;
          nextPathForRecursion = combined;
          pathStringForUi = combined;
        }

        return {
          name: entry.name.replace(/\.md$/, ''),
          path: pathStringForUi,
          isDirectory: isDir,
          children: isDir
            ? await build_file_tree_from_fs(nextPathForRecursion)
            : [],
        };
      })
  );

  return nodes;
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

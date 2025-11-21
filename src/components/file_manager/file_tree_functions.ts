import { readDir } from "@tauri-apps/plugin-fs";
import { type FileNode } from "@/types";

export async function build_file_tree_from_fs(
  dirPath: string,
): Promise<FileNode[]> {
  const entries = await readDir(dirPath);

  const nodes = await Promise.all(
    entries
      .filter(
        (entry) =>
          (entry.isDirectory && !entry.name.startsWith(".")) ||
          entry.name.endsWith(".md"),
      )
      .map(async (entry) => ({
        name: entry.name.replace(/\.md$/, ""),
        path: `${dirPath}/${entry.name}`,
        isDirectory: entry.isDirectory,
        children: entry.isDirectory
          ? await build_file_tree_from_fs(`${dirPath}/${entry.name}`)
          : [],
      })),
  );

  return nodes;
}
export function sort_file_tree(nodes: FileNode[]): FileNode[] {
  // Sort array in-place
  nodes.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base",
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
  offset = "",
): FileNode {
  const rel_path = new_node.path.startsWith(offset)
    ? new_node.path.slice(offset.length)
    : new_node.path;
  const parts = rel_path.split(/[/\\]/).filter(Boolean).slice(0, -1);

  let level = roots;
  let current_path = offset.replace(/[/\\]+$/, "");

  for (const part of parts) {
    current_path += "/" + part;
    let node = level.find((n) => n.isDirectory && n.name === part);

    if (!node) {
      level.push(
        (node = {
          name: part,
          path: current_path,
          isDirectory: true,
          children: [],
        }),
      );
    }

    level = node.children;
  }

  level.push(new_node);
  return new_node;
}
export const get_parent_path = (p: string) =>
  p.split("/").slice(0, -1).join("/");

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

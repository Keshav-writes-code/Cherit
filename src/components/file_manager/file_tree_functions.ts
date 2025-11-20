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
  return [...nodes] // 1. Shallow copy the array to prevent in-place sorting
    .sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    })
    .map((node) => ({
      ...node, // 2. Shallow copy the node object
      // 3. Assign the result of the recursion to the 'children' property of the new node
      children: node.children?.length
        ? sort_file_tree(node.children)
        : node.children,
    }));
}

import { readDir } from "@tauri-apps/plugin-fs";
export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: FileNode[];
  expanded?: boolean; // Optional: For UI expansion state
}

// Recursive function to build the file tree
export async function build_file_tree(dirPath: string): Promise<FileNode[]> {
  const entries = await readDir(dirPath);
  const tree: FileNode[] = [];

  for (const entry of entries) {
    const fullPath = `${dirPath}/${entry.name}`;
    const node: FileNode = {
      name: entry.name,
      path: fullPath,
      isDirectory: entry.isDirectory,
      children: [],
    };

    if (entry.isDirectory) {
      // Recursively build children for directories
      node.children = await build_file_tree(fullPath);
    }

    tree.push(node);
  }

  return tree;
}

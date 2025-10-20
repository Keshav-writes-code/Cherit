import { readDir } from "@tauri-apps/plugin-fs";
import { type FileNode } from "@/types";

export async function build_file_tree(dirPath: string): Promise<FileNode[]> {
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
          ? await build_file_tree(`${dirPath}/${entry.name}`)
          : [],
      })),
  );

  return nodes.sort(
    (a, b) => (b.isDirectory ? 1 : 0) - (a.isDirectory ? 1 : 0),
  );
}

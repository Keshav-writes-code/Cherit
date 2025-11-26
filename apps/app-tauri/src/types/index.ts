import type { FsPath } from 'tauri-plugin-android-fs-api';

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: FileNode[];
}
export type RootPath = string | FsPath | undefined;

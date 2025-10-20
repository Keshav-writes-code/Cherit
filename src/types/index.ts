export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: FileNode[];
}

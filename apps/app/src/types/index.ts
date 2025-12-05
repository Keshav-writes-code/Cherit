export interface FileNode {
  name: string;
  path: string;
  is_directory: boolean;
  children: FileNode[];
}
export type GenericPath = {
  path: string;
  document_top_tree_uri: string | null;
};

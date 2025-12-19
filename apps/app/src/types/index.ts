export interface Node {
  name: string;
  path: string;
  is_directory: boolean;
  children: Node[];
}
export type GenericPath = {
  path: string;
  document_top_tree_uri: string | null;
};

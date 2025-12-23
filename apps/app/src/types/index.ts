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
export type MenuItem = {
  label: string;
  action?: () => void;
  type?: 'default' | 'danger' | 'warning';
  icon_class?: string;
  divider?: boolean; // To render a <hr>
};

export type RecentPath = GenericPath & { last_accessed: Date };

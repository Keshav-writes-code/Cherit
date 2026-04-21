export interface Node {
  name: string;
  path: string;
  is_directory: boolean;
  children: Node[];
}

export type MenuItem = {
  label: string;
  action?: () => void;
  type?: 'default' | 'danger' | 'warning';
  icon_class?: string;
  experimental?: boolean;
  tooltip?: string;
  divider?: boolean; // To render a <hr>
};
export type SubmitStates =
  | 'idle'
  | 'disabled'
  | 'waiting'
  | 'success'
  | 'error';
export type GenericPath = {
  path: string;
  document_top_tree_uri: string | null;
};

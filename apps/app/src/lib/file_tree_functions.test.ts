import { describe, it, expect, vi } from 'vitest';
import * as Logic from './file_tree_logic';
import { type FileNode, type GenericPath } from '@/types';

describe('file_tree_logic', () => {

  // --- Pure Logic Tests ---

  describe('build_tree_recursive', () => {
    it('should recursively build tree from fetcher results', async () => {
      // Mock fetcher
      const fetcher = vi.fn(async (path: GenericPath) => {
        if (path.path === '/root') {
          return [
            { name: 'folder', path: '/root/folder', is_directory: true, children: [] },
            { name: 'file', path: '/root/file.md', is_directory: false, children: [] },
          ];
        } else if (path.path === '/root/folder') {
          return [
             { name: 'sub', path: '/root/folder/sub.md', is_directory: false, children: [] },
          ];
        }
        return [];
      });

      const root: GenericPath = { path: '/root', document_top_tree_uri: null };
      const result = await Logic.build_tree_recursive(root, fetcher);

      expect(fetcher).toHaveBeenCalledTimes(2); // root and folder
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('folder');
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].name).toBe('sub');
      expect(result[1].name).toBe('file');
    });
  });

  describe('find_unused_name', () => {
      it('should return base name if unused', () => {
          const tree: FileNode[] = [];
          const name = Logic.find_unused_name(tree, '/root', 'Untitled', '.md', false);
          expect(name).toBe('Untitled');
      });

      it('should increment name if used', () => {
          const tree: FileNode[] = [
               { name: 'Untitled', path: '/root/Untitled.md', is_directory: false, children: [] }
          ];
          const name = Logic.find_unused_name(tree, '/root', 'Untitled', '.md', false);
          expect(name).toBe('Untitled 1');
      });

      it('should handle android paths encoding', () => {
          const tree: FileNode[] = [
              { name: 'Untitled', path: 'content://root%2FUntitled.md', is_directory: false, children: [] }
          ];
          const name = Logic.find_unused_name(tree, 'content://root', 'Untitled', '.md', false);
          expect(name).toBe('Untitled 1');
      });
  });

  describe('update_tree_after_move', () => {
      it('should move node in tree structure', () => {
          const tree: FileNode[] = [
              { name: 'folder', path: '/root/folder', is_directory: true, children: [] },
              { name: 'file', path: '/root/file', is_directory: false, children: [] }
          ];
          const nodeToMove = tree[1];
          // Clone or reference doesn't matter much for this test structure as long as refs are valid

          Logic.update_tree_after_move(tree, nodeToMove, '/root/folder', '/root/folder/file');

          expect(tree).toHaveLength(1); // file moved
          expect(tree[0].children).toHaveLength(1);
          expect(tree[0].children[0].name).toBe('file');
          expect(tree[0].children[0].path).toBe('/root/folder/file');
      });

      it('should update children paths recursively', () => {
           const tree: FileNode[] = [
              { name: 'folder', path: '/root/folder', is_directory: true, children: [] },
              {
                  name: 'src',
                  path: '/root/src',
                  is_directory: true,
                  children: [
                      { name: 'a', path: '/root/src/a', is_directory: false, children: [] }
                  ]
              }
          ];
          const nodeToMove = tree[1];

          Logic.update_tree_after_move(tree, nodeToMove, '/root/folder', '/root/folder/src');

          expect(tree[0].children[0].path).toBe('/root/folder/src');
          expect(tree[0].children[0].children[0].path).toBe('/root/folder/src/a');
      });
  });

  describe('transform_entries_to_filenode', () => {
    it('should transform entries correctly using joinFn', async () => {
      const entries: any[] = [
        { name: 'folder', isDirectory: true, isFile: false, isSymlink: false },
        { name: 'note.md', isDirectory: false, isFile: true, isSymlink: false },
      ];
      const base_path = '/home/user';
      const joinFn = vi.fn(async (...parts: string[]) => parts.join('/'));

      const result = await Logic.transform_entries_to_filenode(
        entries,
        base_path,
        joinFn
      );

      expect(result).toHaveLength(2);
      expect(result[0].path).toBe('/home/user/folder');
      expect(result[1].path).toBe('/home/user/note.md');
      expect(joinFn).toHaveBeenCalled();
    });
  });

  describe('transform_android_entries_to_filenode', () => {
    it('should transform android entries correctly', async () => {
      const entries: any[] = [
        { name: 'folder', type: 'Dir' },
        { name: 'note.md', type: 'File' },
      ];
      const base_path = 'content://tree';

      const result =
        await Logic.transform_android_entries_to_filenode(
          entries,
          base_path
        );

      expect(result).toHaveLength(2);
      expect(result[0].path).toBe('content://tree%2Ffolder');
      expect(result[1].path).toBe('content://tree%2Fnote.md');
    });
  });

  describe('sort_file_tree', () => {
    it('should sort directories first then files alphabetically', () => {
      const nodes: FileNode[] = [
        { name: 'b', path: '/b', is_directory: false, children: [] },
        { name: 'a', path: '/a', is_directory: true, children: [] },
      ];
      const sorted = Logic.sort_file_tree(nodes);
      expect(sorted[0].name).toBe('a');
      expect(sorted[1].name).toBe('b');
    });
  });

  describe('insert_node_in_place', () => {
      it('should insert a node in place correctly', () => {
          const roots: FileNode[] = [];
          const newNode: FileNode = {
              name: 'file',
              path: '/root/a/b/file.md',
              is_directory: false,
              children: []
          };

          Logic.insert_node_in_place(roots, newNode, '/root');

          expect(roots).toHaveLength(1);
          expect(roots[0].name).toBe('a');
          expect(roots[0].children[0].name).toBe('b');
          expect(roots[0].children[0].children[0]).toEqual(newNode);
      });
  });

  describe('get_parent_path', () => {
      it('should return parent path', () => {
          expect(Logic.get_parent_path('/a/b/c')).toBe('/a/b');
      });

      it('should return parent path for android uri', () => {
           expect(Logic.get_parent_path('content://root%2Fa%2Fb')).toBe('content://root%2Fa');
      });
  });

  describe('exists', () => {
      it('should check existence', () => {
          const tree: FileNode[] = [
              { name: 'a', path: '/root/a', is_directory: false, children: [] }
          ];
          expect(Logic.exists(tree, '/root/a')).toBe(true);
          expect(Logic.exists(tree, '/root/b')).toBe(false);
      });
  });

  describe('get_relative_path_parts', () => {
      it('should return relative path parts', () => {
          expect(Logic.get_relative_path_parts('/root/a/b', '/root')).toEqual(['a', 'b']);
      });
  });
});

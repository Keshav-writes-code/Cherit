import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fileTreeFunctions from './file_tree_functions';
import { type FileNode, type GenericPath } from '@/types';

// Mocks
vi.mock('@tauri-apps/plugin-fs', () => ({
  create: vi.fn(),
  mkdir: vi.fn(),
  readDir: vi.fn(),
  rename: vi.fn(),
}));

vi.mock('@tauri-apps/api/path', () => ({
  join: vi.fn((...args: string[]) => Promise.resolve(args.join('/'))),
}));

vi.mock('tauri-plugin-android-fs-api', () => ({
  AndroidFs: {
    readDir: vi.fn(),
    createNewFile: vi.fn(),
    createDirAll: vi.fn(),
  },
}));

const mocks = vi.hoisted(() => ({
  current_platform: 'linux',
}));

vi.mock('@/misc_global_states.svelte', () => ({
  get current_platform() {
    return mocks.current_platform;
  },
}));

import { create, mkdir, readDir, rename } from '@tauri-apps/plugin-fs';
import { AndroidFs } from 'tauri-plugin-android-fs-api';

describe('file_tree_functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.current_platform = 'linux';
  });

  // --- Pure Logic Tests ---

  describe('build_tree_recursive (Pure)', () => {
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
      const result = await fileTreeFunctions.build_tree_recursive(root, fetcher);

      expect(fetcher).toHaveBeenCalledTimes(2); // root and folder
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('folder');
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].name).toBe('sub');
      expect(result[1].name).toBe('file');
    });
  });

  describe('find_unused_name (Pure)', () => {
      it('should return base name if unused', () => {
          const tree: FileNode[] = [];
          const name = fileTreeFunctions.find_unused_name(tree, '/root', 'Untitled', '.md', false);
          expect(name).toBe('Untitled');
      });

      it('should increment name if used', () => {
          const tree: FileNode[] = [
               { name: 'Untitled', path: '/root/Untitled.md', is_directory: false, children: [] }
          ];
          const name = fileTreeFunctions.find_unused_name(tree, '/root', 'Untitled', '.md', false);
          expect(name).toBe('Untitled 1');
      });

      it('should handle android paths encoding', () => {
          const tree: FileNode[] = [
              { name: 'Untitled', path: 'content://root%2FUntitled.md', is_directory: false, children: [] }
          ];
          // parent path is encoded in real app usage when passed to recursive functions or checked
          // but here find_unused_name expects the parent path.
          // Note: transform_android_entries_to_filenode constructs path as `${base_dir_path}%2F${encodeURIComponent(entry.name)}`

          const name = fileTreeFunctions.find_unused_name(tree, 'content://root', 'Untitled', '.md', false);
          expect(name).toBe('Untitled 1');
      });
  });

  describe('update_tree_after_move (Pure)', () => {
      it('should move node in tree structure', () => {
          const tree: FileNode[] = [
              { name: 'folder', path: '/root/folder', is_directory: true, children: [] },
              { name: 'file', path: '/root/file', is_directory: false, children: [] }
          ];
          const nodeToMove = tree[1];
          // We must clone or pick reference. Since update_tree_after_move modifies in place.

          fileTreeFunctions.update_tree_after_move(tree, nodeToMove, '/root/folder', '/root/folder/file');

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

          fileTreeFunctions.update_tree_after_move(tree, nodeToMove, '/root/folder', '/root/folder/src');

          expect(tree[0].children[0].path).toBe('/root/folder/src');
          expect(tree[0].children[0].children[0].path).toBe('/root/folder/src/a');
      });
  });

  // --- Integration / Wrapper Tests ---

  // These tests mock the platform I/O but ensure the wrappers correctly call the pure logic + I/O.
  // They are less critical for logic verification now but good for ensuring wiring.

  describe('build_file_tree_from_fs', () => {
    it('should wire up desktop fetcher correctly', async () => {
      mocks.current_platform = 'linux';
      (readDir as any).mockResolvedValue([
        { name: 'note.md', isDirectory: false, isFile: true },
      ]);

      const result = await fileTreeFunctions.build_file_tree_from_fs({
        path: '/root',
        document_top_tree_uri: null,
      });

      expect(readDir).toHaveBeenCalledWith('/root');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('note');
    });

    it('should wire up android fetcher correctly', async () => {
      mocks.current_platform = 'android';
      (AndroidFs.readDir as any).mockResolvedValue([
        { name: 'note.md', type: 'File' },
      ]);

      const result = await fileTreeFunctions.build_file_tree_from_fs({
        path: 'content://tree',
        document_top_tree_uri: 'content://tree',
      });

      expect(AndroidFs.readDir).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('transform_entries_to_filenode', () => {
    it('should transform entries correctly', async () => {
      const entries: any[] = [
        { name: 'folder', isDirectory: true, isFile: false, isSymlink: false },
        {
          name: 'note.md',
          isDirectory: false,
          isFile: true,
          isSymlink: false,
        },
      ];
      const base_path = '/home/user';

      const result = await fileTreeFunctions.transform_entries_to_filenode(
        entries,
        base_path
      );

      expect(result).toHaveLength(2);
      expect(result[0].path).toBe('/home/user/folder');
    });
  });

  describe('sort_file_tree', () => {
    it('should sort directories first then files alphabetically', () => {
      const nodes: FileNode[] = [
        { name: 'b', path: '/b', is_directory: false, children: [] },
        { name: 'a', path: '/a', is_directory: true, children: [] },
      ];
      const sorted = fileTreeFunctions.sort_file_tree(nodes);
      expect(sorted[0].name).toBe('a');
      expect(sorted[1].name).toBe('b');
    });
  });

  describe('move_node', () => {
      it('should call rename and update tree', async () => {
          const tree: FileNode[] = [
              { name: 'folder', path: '/root/folder', is_directory: true, children: [] },
              { name: 'file', path: '/root/file', is_directory: false, children: [] }
          ];
          const nodeToMove = tree[1];
          const newParent = '/root/folder';

          await fileTreeFunctions.move_node(nodeToMove, newParent, tree);

          expect(rename).toHaveBeenCalledWith('/root/file', '/root/folder/file');
          // Tree update verification is covered by pure test, but checking effect here confirms wiring
          expect(tree).toHaveLength(1);
          expect(tree[0].children).toHaveLength(1);
      });
  });

  describe('add_new_note', () => {
      it('should create file and insert node', async () => {
          const tree: FileNode[] = [];
          const focused_path = '/root';

          await fileTreeFunctions.add_new_note(tree, focused_path, { path: '/root', document_top_tree_uri: null });

          expect(create).toHaveBeenCalledWith('/root/Untitled.md');
          expect(tree).toHaveLength(1);
          expect(tree[0].name).toBe('Untitled');
      });
  });

   describe('add_new_folder', () => {
      it('should create folder and insert node', async () => {
          const tree: FileNode[] = [];
          const focused_path = '/root';

          await fileTreeFunctions.add_new_folder(tree, focused_path, { path: '/root', document_top_tree_uri: null });

          expect(mkdir).toHaveBeenCalledWith('/root/Untitled');
          expect(tree).toHaveLength(1);
          expect(tree[0].name).toBe('Untitled');
      });
  });
});

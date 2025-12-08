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

// We need a way to mock current_platform. Since it is a constant exported from a module,
// we can use vi.mock with a factory that returns a getter.
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
import { join } from '@tauri-apps/api/path';

describe('file_tree_functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.current_platform = 'linux';
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
        {
          name: 'other.txt',
          isDirectory: false,
          isFile: true,
          isSymlink: false,
        },
        {
          name: '.hidden',
          isDirectory: true,
          isFile: false,
          isSymlink: false,
        },
      ];
      const base_path = '/home/user';

      const result = await fileTreeFunctions.transform_entries_to_filenode(
        entries,
        base_path
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'folder',
        path: '/home/user/folder',
        is_directory: true,
        children: [],
      });
      expect(result[1]).toEqual({
        name: 'note',
        path: '/home/user/note.md',
        is_directory: false,
        children: [],
      });
    });
  });

  describe('transform_android_entries_to_filenode', () => {
    it('should transform android entries correctly', async () => {
      const entries: any[] = [
        { name: 'folder', type: 'Dir' },
        { name: 'note.md', type: 'File' },
        { name: 'other.txt', type: 'File' },
        { name: '.hidden', type: 'Dir' },
      ];
      const base_path = 'content://tree';

      const result =
        await fileTreeFunctions.transform_android_entries_to_filenode(
          entries,
          base_path
        );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'folder',
        path: 'content://tree%2Ffolder',
        is_directory: true,
        children: [],
      });
      expect(result[1]).toEqual({
        name: 'note',
        path: 'content://tree%2Fnote.md',
        is_directory: false,
        children: [],
      });
    });
  });

  describe('build_file_tree_from_fs', () => {
    it('should build file tree for desktop', async () => {
      mocks.current_platform = 'linux';
      (readDir as any).mockResolvedValue([
        { name: 'folder', isDirectory: true, isFile: false },
        { name: 'note.md', isDirectory: false, isFile: true },
      ]);
      // Mock recursive call
      (readDir as any).mockImplementation((path: string) => {
        if (path === '/root/folder') {
          return Promise.resolve([
            { name: 'subnote.md', isDirectory: false, isFile: true },
          ]);
        }
        return Promise.resolve([
          { name: 'folder', isDirectory: true, isFile: false },
          { name: 'note.md', isDirectory: false, isFile: true },
        ]);
      });

      const result = await fileTreeFunctions.build_file_tree_from_fs({
        path: '/root',
        document_top_tree_uri: null,
      });

      expect(readDir).toHaveBeenCalledTimes(2); // root and folder
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('folder');
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].name).toBe('subnote');
      expect(result[1].name).toBe('note');
    });

    it('should build file tree for android', async () => {
      mocks.current_platform = 'android';
      (AndroidFs.readDir as any).mockResolvedValue([
        { name: 'folder', type: 'Dir' },
        { name: 'note.md', type: 'File' },
      ]);
      (AndroidFs.readDir as any).mockImplementation(
        (args: { uri: string }) => {
          if (args.uri.includes('folder')) {
             return Promise.resolve([{ name: 'subnote.md', type: 'File' }]);
          }
           return Promise.resolve([
            { name: 'folder', type: 'Dir' },
            { name: 'note.md', type: 'File' },
          ]);
        }
      )

      const result = await fileTreeFunctions.build_file_tree_from_fs({
        path: 'content://tree',
        document_top_tree_uri: 'content://tree',
      });

      expect(AndroidFs.readDir).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('folder');
      expect(result[0].children).toHaveLength(1);
    });

    it('should throw error on android if document_top_tree_uri is missing', async () => {
      mocks.current_platform = 'android';
      await expect(
        fileTreeFunctions.build_file_tree_from_fs({
          path: 'content://tree',
          document_top_tree_uri: null,
        })
      ).rejects.toThrow('Document top tree URI is not set');
    });
  });

  describe('sort_file_tree', () => {
    it('should sort directories first then files alphabetically', () => {
      const nodes: FileNode[] = [
        {
          name: 'b_file',
          path: '/b',
          is_directory: false,
          children: [],
        },
        {
          name: 'a_folder',
          path: '/a',
          is_directory: true,
          children: [],
        },
        {
          name: 'a_file',
          path: '/a_file',
          is_directory: false,
          children: [],
        },
        {
            name: 'b_folder',
            path: '/b_folder',
            is_directory: true,
            children: [
                { name: 'd', path: '/b/d', is_directory: false, children: [] },
                { name: 'c', path: '/b/c', is_directory: false, children: [] }
            ]
        }
      ];

      const sorted = fileTreeFunctions.sort_file_tree(nodes);

      expect(sorted[0].name).toBe('a_folder');
      expect(sorted[1].name).toBe('b_folder');
      expect(sorted[2].name).toBe('a_file');
      expect(sorted[3].name).toBe('b_file');

      // Check children sorting
      expect(sorted[1].children[0].name).toBe('c');
      expect(sorted[1].children[1].name).toBe('d');
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

          fileTreeFunctions.insert_node_in_place(roots, newNode, '/root');

          expect(roots).toHaveLength(1);
          expect(roots[0].name).toBe('a');
          expect(roots[0].children).toHaveLength(1);
          expect(roots[0].children[0].name).toBe('b');
          expect(roots[0].children[0].children).toHaveLength(1);
          expect(roots[0].children[0].children[0]).toEqual(newNode);
      });

      it('should handle android paths with encoding', () => {
          mocks.current_platform = 'android';
          const roots: FileNode[] = [];
          const newNode: FileNode = {
              name: 'file',
              path: 'content://root%2Fa%2Fb%2Ffile.md',
              is_directory: false,
              children: []
          };

          fileTreeFunctions.insert_node_in_place(roots, newNode, 'content://root');

          expect(roots).toHaveLength(1);
          expect(roots[0].name).toBe('a');
          expect(roots[0].children).toHaveLength(1);
          expect(roots[0].children[0].name).toBe('b');
      });
  });

  describe('move_node', () => {
      it('should move node to new parent', async () => {
          const tree: FileNode[] = [
              { name: 'folder', path: '/root/folder', is_directory: true, children: [] },
              { name: 'file', path: '/root/file', is_directory: false, children: [] }
          ];
          const nodeToMove = tree[1];
          const newParent = '/root/folder';

          await fileTreeFunctions.move_node(nodeToMove, newParent, tree);

          expect(rename).toHaveBeenCalledWith('/root/file', '/root/folder/file');
          expect(tree).toHaveLength(1); // file moved out of root
          expect(tree[0].children).toHaveLength(1);
          expect(tree[0].children[0].name).toBe('file');
          expect(tree[0].children[0].path).toBe('/root/folder/file');
      });
  });

  describe('add_new_note', () => {
      it('should add new note', async () => {
          const tree: FileNode[] = [];
          const focused_path = '/root';

          await fileTreeFunctions.add_new_note(tree, focused_path, { path: '/root', document_top_tree_uri: null });

          expect(create).toHaveBeenCalledWith('/root/Untitled.md');
          expect(tree).toHaveLength(1);
          expect(tree[0].name).toBe('Untitled');
      });

      it('should increment name if exists', async () => {
          const tree: FileNode[] = [
              { name: 'Untitled', path: '/root/Untitled.md', is_directory: false, children: [] }
          ];
          const focused_path = '/root';

          await fileTreeFunctions.add_new_note(tree, focused_path, { path: '/root', document_top_tree_uri: null });

          expect(create).toHaveBeenCalledWith('/root/Untitled 1.md');
          expect(tree).toHaveLength(2);
          expect(tree[1].name).toBe('Untitled 1');
      });

      it('should use AndroidFs on android', async () => {
          mocks.current_platform = 'android';
           const tree: FileNode[] = [];
          const focused_path = 'content://root';

          await fileTreeFunctions.add_new_note(tree, focused_path, { path: 'content://root', document_top_tree_uri: 'uri' });

          expect(AndroidFs.createNewFile).toHaveBeenCalled();
      })
  });

   describe('add_new_folder', () => {
      it('should add new folder', async () => {
          const tree: FileNode[] = [];
          const focused_path = '/root';

          await fileTreeFunctions.add_new_folder(tree, focused_path, { path: '/root', document_top_tree_uri: null });

          expect(mkdir).toHaveBeenCalledWith('/root/Untitled');
          expect(tree).toHaveLength(1);
          expect(tree[0].name).toBe('Untitled');
          expect(tree[0].is_directory).toBe(true);
      });
  });

  describe('get_parent_path', () => {
      it('should return parent path', () => {
          expect(fileTreeFunctions.get_parent_path('/a/b/c')).toBe('/a/b');
          expect(fileTreeFunctions.get_parent_path('/a')).toBe('/');
      });

      it('should return parent path for android uri', () => {
           expect(fileTreeFunctions.get_parent_path('content://root%2Fa%2Fb')).toBe('content://root%2Fa');
      });
  });

  describe('exists', () => {
      it('should return true if file exists', () => {
          const tree: FileNode[] = [
              { name: 'a', path: '/root/a', is_directory: false, children: [] }
          ];
          expect(fileTreeFunctions.exists(tree, '/root/a')).toBe(true);
      });

      it('should return false if file does not exist', () => {
           const tree: FileNode[] = [
              { name: 'a', path: '/root/a', is_directory: false, children: [] }
          ];
          expect(fileTreeFunctions.exists(tree, '/root/b')).toBe(false);
      });
  });

  describe('get_relative_path_parts', () => {
      it('should return relative path parts', () => {
          expect(fileTreeFunctions.get_relative_path_parts('/root/a/b', '/root')).toEqual(['a', 'b']);
      });

      it('should handle android uri decoding', () => {
          // The function decodes both path and offset.
          expect(fileTreeFunctions.get_relative_path_parts('content://root%2Fa%2Fb', 'content://root')).toEqual(['a', 'b']);
      });
  });
});

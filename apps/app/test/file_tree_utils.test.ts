import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  get_parent_path,
  sort_file_tree,
  get_relative_path_parts,
  exists,
  find_unused_name,
} from '@/lib/file_tree/utils';
import type { FileNode } from '@/types';

// Dynamic mock for current_platform
const mocks = vi.hoisted(() => {
  return {
    current_platform: 'linux',
  };
});

vi.mock('@/misc_global_states.svelte', () => ({
  get current_platform() {
    return mocks.current_platform;
  }
}));

describe('file_tree/utils', () => {
  beforeEach(() => {
    mocks.current_platform = 'linux';
  });

  describe('get_parent_path', () => {
    it('returns parent path for normal path', () => {
      expect(get_parent_path('/a/b/c')).toBe('/a/b');
      expect(get_parent_path('/a')).toBe('/');
    });

    it('returns parent path for windows path', () => {
      mocks.current_platform = 'windows';
      expect(get_parent_path('C:\\a\\b\\c')).toBe('C:\\a\\b');
      expect(get_parent_path('C:\\a')).toBe('C:\\');
    });

    it('returns root for root path', () => {
      expect(get_parent_path('/')).toBe('/');

      mocks.current_platform = 'windows';
      expect(get_parent_path('C:\\')).toBe('C:\\');
    });

    it('handles android content paths', () => {
      mocks.current_platform = 'android';
      const base = 'content://com.android.externalstorage.documents/tree/primary%3A/document/primary%3ADocuments';
      const child = `${base}%2Ftest`;
      expect(get_parent_path(child)).toBe(base);
    });

    it('handles root android path', () => {
      mocks.current_platform = 'android';
      const base = 'content://com.android.externalstorage.documents/tree/primary%3A';
      expect(get_parent_path(base)).toBe(base);
    });
  });

  describe('sort_file_tree', () => {
    it('sorts directories before files', () => {
      const nodes: FileNode[] = [
        { name: 'file1', path: '/file1', is_directory: false, children: [] },
        { name: 'dir1', path: '/dir1', is_directory: true, children: [] },
      ];
      const sorted = sort_file_tree(nodes);
      expect(sorted[0].name).toBe('dir1');
      expect(sorted[1].name).toBe('file1');
    });

    it('sorts alphabetically within same type', () => {
      const nodes: FileNode[] = [
        { name: 'b', path: '/b', is_directory: false, children: [] },
        { name: 'a', path: '/a', is_directory: false, children: [] },
        { name: 'd', path: '/d', is_directory: true, children: [] },
        { name: 'c', path: '/c', is_directory: true, children: [] },
      ];
      const sorted = sort_file_tree(nodes);
      expect(sorted.map(n => n.name)).toEqual(['c', 'd', 'a', 'b']);
    });

    it('sorts recursively', () => {
        const nodes: FileNode[] = [
            {
                name: 'root',
                path: '/root',
                is_directory: true,
                children: [
                    { name: 'f2', path: '/root/f2', is_directory: false, children: [] },
                    { name: 'f1', path: '/root/f1', is_directory: false, children: [] },
                ]
            }
        ];
        const sorted = sort_file_tree(nodes);
        expect(sorted[0].children.map(n => n.name)).toEqual(['f1', 'f2']);
    });
  });

  describe('get_relative_path_parts', () => {
    it('returns relative parts', () => {
      expect(get_relative_path_parts('/a/b/c', '/a')).toEqual(['b', 'c']);
    });

    it('handles url encoded paths', () => {
        // Mocking behavior of decodeURIComponent used in implementation
        expect(get_relative_path_parts('/a%2Fb%2Fc', '/a')).toEqual(['b', 'c']);
    });
  });

  describe('exists', () => {
    const tree: FileNode[] = [
      {
        name: 'folder',
        path: '/folder',
        is_directory: true,
        children: [
          { name: 'file', path: '/folder/file', is_directory: false, children: [] },
        ],
      },
    ];

    it('returns true if file exists in folder', () => {
      expect(exists('/folder', 'file', '/', false, tree)).toBe(true);
    });

    it('returns false if file does not exist', () => {
      expect(exists('/folder', 'other', '/', false, tree)).toBe(false);
    });

    it('returns false if folder does not exist', () => {
      expect(exists('/other', 'file', '/', false, tree)).toBe(false);
    });
  });

  describe('find_unused_name', () => {
     const tree: FileNode[] = [
      {
        name: 'folder',
        path: '/folder',
        is_directory: true,
        children: [
          { name: 'Untitled', path: '/folder/Untitled', is_directory: false, children: [] },
          { name: 'Untitled 1', path: '/folder/Untitled 1', is_directory: false, children: [] },
        ],
      },
    ];

    it('returns base name if unused', () => {
        expect(find_unused_name('New', '/folder', '/', tree, false)).toBe('New');
    });

    it('increments name if used', () => {
        expect(find_unused_name('Untitled', '/folder', '/', tree, false)).toBe('Untitled 2');
    });
  });
});

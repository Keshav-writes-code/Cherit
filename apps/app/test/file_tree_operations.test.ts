import { describe, it, expect, vi, beforeEach } from 'vitest';
import { insert_node_in_place } from '@/lib/file_tree/operations';
import type { FileNode } from '@/types';
import * as global_states from '@/misc_global_states.svelte';

// Mock the current_platform getter
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

describe('file_tree/operations', () => {
  describe('insert_node_in_place', () => {
    beforeEach(() => {
        mocks.current_platform = 'linux';
    });

    it('inserts node into root', () => {
      const roots: FileNode[] = [];
      const node: FileNode = { name: 'file', path: '/file', is_directory: false, children: [] };
      insert_node_in_place(roots, node, '/');
      expect(roots).toHaveLength(1);
      expect(roots[0]).toBe(node);
    });

    it('inserts node into existing directory', () => {
      const roots: FileNode[] = [
        { name: 'dir', path: '/dir', is_directory: true, children: [] }
      ];
      const node: FileNode = { name: 'file', path: '/dir/file', is_directory: false, children: [] };
      insert_node_in_place(roots, node, '/');
      expect(roots[0].children).toHaveLength(1);
      expect(roots[0].children[0]).toBe(node);
    });

    it('creates intermediate directories if missing', () => {
        const roots: FileNode[] = [];
        const node: FileNode = { name: 'file', path: '/a/b/file', is_directory: false, children: [] };
        insert_node_in_place(roots, node, '/');

        expect(roots).toHaveLength(1);
        expect(roots[0].name).toBe('a');
        expect(roots[0].is_directory).toBe(true);

        expect(roots[0].children).toHaveLength(1);
        expect(roots[0].children[0].name).toBe('b');

        expect(roots[0].children[0].children).toHaveLength(1);
        expect(roots[0].children[0].children[0]).toBe(node);
    });

    it('handles android paths correctly when creating intermediates', () => {
        mocks.current_platform = 'android';
        const roots: FileNode[] = [];
        const rootPath = 'content://tree/primary%3A';
        const nodePath = 'content://tree/primary%3A%2Fa%2Fb%2Ffile';
        const node: FileNode = { name: 'file', path: nodePath, is_directory: false, children: [] };

        insert_node_in_place(roots, node, rootPath);

        expect(roots).toHaveLength(1);
        expect(roots[0].name).toBe('a');
        // Check if path is correctly encoded for android
        expect(roots[0].path).toBe('content://tree/primary%3A%2Fa');

        expect(roots[0].children).toHaveLength(1);
        expect(roots[0].children[0].name).toBe('b');
        expect(roots[0].children[0].path).toBe('content://tree/primary%3A%2Fa%2Fb');
    });

    it('merges with existing intermediate directories', () => {
        const roots: FileNode[] = [
            { name: 'a', path: '/a', is_directory: true, children: [] }
        ];
        const node: FileNode = { name: 'file', path: '/a/b/file', is_directory: false, children: [] };

        insert_node_in_place(roots, node, '/');

        expect(roots).toHaveLength(1);
        expect(roots[0].children).toHaveLength(1);
        expect(roots[0].children[0].name).toBe('b');
        expect(roots[0].children[0].children[0]).toBe(node);
    });
  });
});

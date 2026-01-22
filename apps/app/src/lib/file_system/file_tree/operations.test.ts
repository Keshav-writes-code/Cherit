import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rename_node } from './operations';
import { type Node } from '@/types';

// Mocks
const mocks = vi.hoisted(() => ({
  rename: vi.fn(),
  invoke: vi.fn(),
  toast: { error: vi.fn() },
  platform_ref: { current: 'linux' },
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
  rename: mocks.rename,
  create: vi.fn(),
  mkdir: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: mocks.invoke,
}));

vi.mock('@tauri-apps/plugin-os', () => ({
  platform: vi.fn(() => 'linux'),
}));

vi.mock('svelte-sonner', () => ({
  toast: mocks.toast,
}));

vi.mock('./utils', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = await importOriginal<any>();
  return {
    ...actual,
    get current_platform() { return mocks.platform_ref.current; },
    join_path: (a: string, b: string) => `${a}/${b}`,
    get_parent_path: (p: string) => p.substring(0, p.lastIndexOf('/')),
    sort_nodes: vi.fn(),
  };
});

describe('rename_node', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Desktop', () => {
    beforeEach(() => {
      mocks.platform_ref.current = 'linux';
    });

    it('should rename a file and append .md', async () => {
      const node: Node = {
        name: 'old_name',
        path: '/path/to/old_name.md',
        is_directory: false,
        children: [],
      };
      const tree = [node];

      await rename_node(node, 'new_name', tree, null);

      expect(mocks.rename).toHaveBeenCalledWith(
        '/path/to/old_name.md',
        '/path/to/new_name.md'
      );
      expect(node.name).toBe('new_name');
      expect(node.path).toBe('/path/to/new_name.md');
    });

    it('should rename a directory and update children', async () => {
        const child: Node = {
            name: 'child',
            path: '/path/to/old_dir/child.md',
            is_directory: false,
            children: []
        };
        const node: Node = {
            name: 'old_dir',
            path: '/path/to/old_dir',
            is_directory: true,
            children: [child]
        };
        const tree = [node];

        await rename_node(node, 'new_dir', tree, null);

        expect(mocks.rename).toHaveBeenCalledWith(
            '/path/to/old_dir',
            '/path/to/new_dir'
        );
        expect(node.name).toBe('new_dir');
        expect(node.path).toBe('/path/to/new_dir');
        expect(child.path).toBe('/path/to/new_dir/child.md');
    });
  });

  describe('Android', () => {
    beforeEach(() => {
      mocks.platform_ref.current = 'android';
      mocks.invoke.mockResolvedValue('content://new/path');
    });

    it('should invoke rename_node_android for file', async () => {
       const node: Node = {
        name: 'old_name',
        path: 'content://old/path',
        is_directory: false,
        children: [],
      };
      const tree = [node];

      await rename_node(node, 'new_name', tree, 'doc_uri');

      expect(mocks.invoke).toHaveBeenCalledWith('rename_node_android', {
          uri: 'content://old/path',
          newName: 'new_name.md',
          documentTopTreeUri: 'doc_uri'
      });
      expect(node.path).toBe('content://new/path');
    });

     it('should invoke rename_node_android for dir and update children', async () => {
         const child: Node = {
            name: 'child',
            path: 'content://old/path%2Fchild.md', // encoded
            is_directory: false,
            children: []
        };
       const node: Node = {
        name: 'old_name',
        path: 'content://old/path',
        is_directory: true,
        children: [child],
      };
      const tree = [node];

      await rename_node(node, 'new_name', tree, 'doc_uri');

      expect(mocks.invoke).toHaveBeenCalledWith('rename_node_android', {
          uri: 'content://old/path',
          newName: 'new_name',
          documentTopTreeUri: 'doc_uri'
      });
      expect(node.path).toBe('content://new/path');
      // Verify child update logic
      // The update logic is: p + '%2F' + encodeURIComponent(...)
      // 'content://new/path' + '%2F' + encodeURIComponent('child.md')
      expect(child.path).toBe('content://new/path%2Fchild.md');
    });
  });
});

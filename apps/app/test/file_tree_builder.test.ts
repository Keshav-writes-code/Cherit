import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transform_entries_to_filenode, transform_android_entries_to_filenode } from '@/lib/file_tree/builder';
import type { DirEntry } from '@tauri-apps/plugin-fs';
import type { AndroidEntryMetadataWithUri } from 'tauri-plugin-android-fs-api';

const mocks = vi.hoisted(() => ({
  current_platform: 'linux',
}));

vi.mock('@/misc_global_states.svelte', () => ({
  get current_platform() {
    return mocks.current_platform;
  }
}));

// Mock @tauri-apps/api/path
vi.mock('@tauri-apps/api/path', () => ({
  join: async (...args: string[]) => {
    const sep = mocks.current_platform === 'windows' ? '\\' : '/';
    return args.join(sep);
  },
}));

describe('file_tree/builder', () => {
  beforeEach(() => {
    mocks.current_platform = 'linux';
  });

  describe('transform_entries_to_filenode', () => {
    it('transforms directory entries to file nodes (Linux/Mac)', async () => {
      const entries: DirEntry[] = [
        { name: 'file.md', isDirectory: false, isFile: true, isSymlink: false },
        { name: 'folder', isDirectory: true, isFile: false, isSymlink: false },
        { name: '.hidden', isDirectory: true, isFile: false, isSymlink: false },
        { name: 'other.txt', isDirectory: false, isFile: true, isSymlink: false },
      ];
      const basePath = '/base';
      const nodes = await transform_entries_to_filenode(entries, basePath);

      expect(nodes).toHaveLength(2);

      const fileNode = nodes.find(n => n.name === 'file');
      expect(fileNode).toBeDefined();
      expect(fileNode?.path).toBe('/base/file.md');
      expect(fileNode?.is_directory).toBe(false);

      const folderNode = nodes.find(n => n.name === 'folder');
      expect(folderNode).toBeDefined();
      expect(folderNode?.path).toBe('/base/folder');
      expect(folderNode?.is_directory).toBe(true);
    });

    it('transforms directory entries to file nodes (Windows)', async () => {
      mocks.current_platform = 'windows';
      const entries: DirEntry[] = [
        { name: 'file.md', isDirectory: false, isFile: true, isSymlink: false },
      ];
      const basePath = 'C:\\base';
      const nodes = await transform_entries_to_filenode(entries, basePath);

      expect(nodes).toHaveLength(1);

      const fileNode = nodes[0];
      expect(fileNode.path).toBe('C:\\base\\file.md');
    });
  });

  describe('transform_android_entries_to_filenode', () => {
    it('transforms android entries to file nodes', async () => {
      // Android usually uses transform_android_entries_to_filenode which doesn't use path.join
      // but manually constructs string with %2F.
      const entries: AndroidEntryMetadataWithUri[] = [
        { name: 'file.md', type: 'File', uri: 'u1', lastModified: 0, mimeType: '', size: 0 },
        { name: 'folder', type: 'Dir', uri: 'u2', lastModified: 0, mimeType: '', size: 0 },
        { name: '.hidden', type: 'Dir', uri: 'u3', lastModified: 0, mimeType: '', size: 0 },
        { name: 'other.txt', type: 'File', uri: 'u4', lastModified: 0, mimeType: '', size: 0 },
      ];
      const basePath = 'content://tree';
      const nodes = await transform_android_entries_to_filenode(entries, basePath);

      expect(nodes).toHaveLength(2);

      const fileNode = nodes.find(n => n.name === 'file');
      expect(fileNode).toBeDefined();
      expect(fileNode?.path).toBe('content://tree%2Ffile.md');
      expect(fileNode?.is_directory).toBe(false);

      const folderNode = nodes.find(n => n.name === 'folder');
      expect(folderNode).toBeDefined();
      expect(folderNode?.path).toBe('content://tree%2Ffolder');
      expect(folderNode?.is_directory).toBe(true);
    });

    it('encodes special characters in android paths', async () => {
        const entries: AndroidEntryMetadataWithUri[] = [
            { name: 'my folder', type: 'Dir', uri: 'u1', lastModified: 0, mimeType: '', size: 0 }
        ];
        const basePath = 'content://tree';
        const nodes = await transform_android_entries_to_filenode(entries, basePath);

        expect(nodes[0].name).toBe('my folder');
        expect(nodes[0].path).toBe('content://tree%2Fmy%20folder');
    });
  });
});

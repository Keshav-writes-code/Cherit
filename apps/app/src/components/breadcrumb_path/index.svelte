<script lang="ts">
  import type { FileNode, RootPath } from '@/types';
  let {
    filenode,
    root_path,
    class: classes = 'text-xs',
  }: {
    filenode: FileNode | undefined;
    root_path: RootPath;
    class?: string;
  } = $props();

  let segments = $derived.by(() => {
    if (!filenode) return [];

    let root = root_path || '';
    let file = filenode.path;

    // Fix Android: Extract only the decoded ID (last segment) to ignore 'tree' vs 'document' prefix mismatch
    if (file.startsWith('content:')) {
      file = decodeURIComponent(file.split('/').pop() || '');
      root = decodeURIComponent(root.split('/').pop() || '');
    }

    // Remove root from file path and split
    return file.replace(root, '').split('/').filter(Boolean);
  });
</script>

<div class="{classes} breadcrumbs">
  <ul>
    {#each segments as seg, i}
      <li
        class={i < segments.length - 1
          ? 'text-[color-mix(in_srgb,var(--color-base-content)_80%,black)]'
          : ''}
      >
        {seg.replace(/\.md$/, '')}
      </li>
    {/each}
  </ul>
</div>

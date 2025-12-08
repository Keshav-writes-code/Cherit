<script lang="ts">
  import { get_relative_path_parts } from '@/lib/file_tree';
  import type { FileNode, GenericPath } from '@/types';
  let {
    filenode,
    root_path,
    class: classes = 'text-xs',
  }: {
    filenode: FileNode | undefined;
    root_path: GenericPath;
    class?: string;
  } = $props();

  let segments = $derived.by(() => {
    if (!filenode || !root_path) return [];
    const res = get_relative_path_parts(filenode.path, root_path.path);
    return res;
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

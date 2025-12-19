<script lang="ts">
  import { get_relative_path_parts } from '@/lib/file_tree';
  import { root_path } from '@/lib/states/ui_states.svelte';
  import type { Node } from '@/types';
  let {
    filenode,
    class: classes = 'text-xs',
  }: {
    filenode: Node | undefined;
    class?: string;
  } = $props();

  let segments = $derived.by(() => {
    if (!filenode || !root_path.data) return [];
    const res = get_relative_path_parts(filenode.path, root_path.data.path);
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

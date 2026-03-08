<script lang="ts">
  import { get_relative_path_parts } from '@/lib/operations/file_tree';
  import { workspace_root_path } from '@/lib/states';
  import type { Node } from '@/lib/types';
  let {
    filenode,
    class: classes = 'text-xs',
  }: {
    filenode: Node | undefined;
    class?: string;
  } = $props();

  let segments = $derived.by(() => {
    if (!filenode || !workspace_root_path.data) return [];
    const res = get_relative_path_parts(
      filenode.path,
      workspace_root_path.data.path
    );
    return res;
  });
</script>

<div class="{classes} breadcrumbs">
  <ul>
    {#each segments as seg, i}
      <li
        class={i < segments.length - 1
          ? 'text-[oklch(from_var(--color-base-content)_calc(l*0.7)_c_h)]'
          : 'text-[oklch(from_var(--color-base-content)_calc(l*0.9)_c_h)]'}
      >
        {seg.replace(/\.md$/, '')}
      </li>
    {/each}
  </ul>
</div>

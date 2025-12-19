<script lang="ts">
  import { root_folder_picker_dialog_state } from '@/lib/misc_global_states.svelte';
  import type { GenericPath } from '@/types';
  let { root_path }: { root_path: GenericPath | undefined } = $props();
</script>

<div
  class="w-full b-t-1 b-t-[color-mix(in_srgb,var(--color-base-content)_22%,black)]"
>
  <ul class="menu menu-xs bg-base-200 rounded-box w-full">
    <li>
      <button
        onclick={() => {
          root_folder_picker_dialog_state.open = true;
        }}
      >
        <div class=" i-famicons:chevron-expand size-4"></div>
        {decodeURIComponent(root_path?.path ?? '')
          .split('/')
          .filter(Boolean)
          .pop()}
      </button>
    </li>
  </ul>
</div>

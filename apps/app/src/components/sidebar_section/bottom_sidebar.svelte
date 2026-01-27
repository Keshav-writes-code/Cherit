<script lang="ts">
  import { workspace_root_path } from '@/lib/global_states/index.svelte';
  import { root_folder_picker_dialog_state } from '@/components/general/root_folder_selector/states.svelte';
</script>

<div
  class="w-full b-t-1 b-t-[color-mix(in_srgb,var(--color-base-content)_22%,black)]"
>
  <ul class="menu menu-lg sm:menu-xs bg-base-200 rounded-box w-full">
    <li>
      <button
        onclick={() => {
          root_folder_picker_dialog_state.open = true;
        }}
      >
        <div class=" i-famicons:chevron-expand size-4"></div>
        {decodeURIComponent(workspace_root_path.data?.path ?? '')
          .split('/')
          .filter(Boolean)
          .pop()}
      </button>
    </li>
  </ul>
</div>

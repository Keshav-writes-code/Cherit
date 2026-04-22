<script lang="ts">
  import { app_settings_dialog_open_state } from '@/components/general/app_settings/states.svelte';
  import { workspace_root_path } from '@/lib/states/session';
  import { workspace_picker_dialog_open_state } from '@/components/general/workspace_selector/states.svelte';
</script>

<div
  class="w-full b-t-1 b-t-[color-mix(in_srgb,var(--color-base-content)_22%,black)] h-11 flex p-1.5"
>
  <button
    class="btn min-h-none justify-start h-full btn-ghost grow"
    onclick={() => {
      workspace_picker_dialog_open_state.data = true;
    }}
  >
    <div
      class=" i-famicons:chevron-expand size-4 color-[color-mix(in_srgb,var(--color-base-content)_70%,black)]"
    ></div>
    {decodeURIComponent(workspace_root_path.data?.path ?? '')
      .split('/')
      .filter(Boolean)
      .pop()}
  </button>
  <button
    class="btn h-full px-2 aspect-square btn-ghost btn-sm"
    aria-label="Settings"
    onclick={() => {
      app_settings_dialog_open_state.data = true;
    }}
  >
    <div
      class="i-tabler:settings size-5 color-[color-mix(in_srgb,var(--color-base-content)_70%,black)]"
    ></div>
  </button>
</div>

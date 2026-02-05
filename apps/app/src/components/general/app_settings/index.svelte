<script lang="ts">
  import { current_platform_type } from '@/lib/file_system';
  import { app_settings_dialog_open_state } from './states.svelte';
</script>

<dialog open={app_settings_dialog_open_state.data} class="modal z-11">
  <div
    class="
    {current_platform_type == 'desktop' && ' w-80% h-85% lt-sm:flex-col'}
    {current_platform_type == 'mobile' && 'size-100% lt-sm:flex-col-reverse '}
    modal-box p-0 flex max-w-275 b-1 b-[color-mix(in_srgb,var(--color-base-content)_32%,black)]"
  >
    <div
      class="max-w-63 w-full h-full b-r-1 b-r-[color-mix(in_srgb,var(--color-base-content)_22%,black)]"
    ></div>
    <form method="dialog">
      <button
        class="btn btn-sm btn-circle btn-ghost absolute
        {current_platform_type == 'mobile'
          ? 'top-12 right-4'
          : 'top-2 right-2'} "
        onclick={() => (app_settings_dialog_open_state.data = false)}
      >
        ✕
      </button>
    </form>
  </div>
</dialog>

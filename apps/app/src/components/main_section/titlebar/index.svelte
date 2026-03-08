<script lang="ts">
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import PaneMenu from '@/components/main_section/pane_menu/index.svelte';
  import { opened_filenode } from '@/lib/states';
  import { current_platform_type } from '@/lib/states/domain_specific/os.svelte';

  const appWindow = getCurrentWindow();
</script>

{#if current_platform_type == 'desktop'}
  <div
    class="  w-full h-10 z-12 flex justify-between bg-[color-mix(in_srgb,var(--color-base-content)_22%,black)] relative"
    data-tauri-drag-region
  >
    <div class="h-full flex justify-center items-center p-1.5">
      <label
        for="my-drawer-3"
        class="btn btn-ghost text-[color-mix(in_srgb,var(--color-base-content)_80%,black)] min-h-none max-h-none h-full w-8 p-none drawer-button lg:hidden"
      >
        <div class="i-tabler:layout-sidebar-filled size-5.5"></div>
      </label>
    </div>
    <div class="flex *:px-3.5 *:hover:bg-white/10 color-white">
      <button
        id="titlebar-minimize"
        onclick={() => {
          appWindow.minimize();
        }}
        title="minimize"
      >
        <div class="i-tabler:minus size-4"></div>
      </button>
      <button
        id="titlebar-maximize"
        onclick={() => {
          appWindow.toggleMaximize();
        }}
        title="maximize"
      >
        <div class="i-tabler:square size-3"></div>
      </button>
      <button
        id="titlebar-close"
        onclick={() => {
          appWindow.close();
        }}
        title="close"
      >
        <div class="i-tabler:x size-4"></div>
      </button>
    </div>
  </div>
{:else}
  <div
    class=" isolate z-2 w-full fixed h-12 flex justify-between items-center px-3"
    style="margin-top: env(safe-area-inset-top);"
  >
    <label
      for="my-drawer-3"
      class="btn btn-soft btn-circle btn-lg text-[color-mix(in_srgb,var(--color-base-content)_80%,black)] min-h-none max-h-none h-full aspect-ratio-square drawer-button"
    >
      <div
        class="i-tabler:layout-sidebar-filled color-[var(--color-primary)] size-7.5"
      ></div>
    </label>
    <div class="justify-self-end">
      <PaneMenu filenode={opened_filenode.data} />
    </div>
  </div>
{/if}

<script lang="ts">
  import { current_platform_type } from '@/misc_global_states.svelte';
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import Breadcrumb from '@/components/breadcrumb_path/index.svelte';
  import type { FileNode, GenericPath } from '@/types';

  const {
    root_path,
    filenode,
  }: { root_path: GenericPath | undefined; filenode: FileNode | undefined } =
    $props();
  const appWindow = getCurrentWindow();
</script>

{#if current_platform_type !== 'mobile'}
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
  <div class=" w-full h-10 grid grid-cols-[1fr_auto_1fr] items-center px-3">
    <label
      for="my-drawer-3"
      class="btn btn-ghost text-[color-mix(in_srgb,var(--color-base-content)_80%,black)] min-h-none max-h-none h-full w-10 p-none drawer-button"
    >
      <div
        class="i-tabler:layout-sidebar-filled color-[var(--color-primary)] size-7.5"
      ></div>
    </label>
    <Breadcrumb class="h-min text-lg" {filenode} {root_path} />
    <div class="justify-self-end">
      <button
        class="  btn btn-ghost text-[color-mix(in_srgb,var(--color-base-content)_80%,black)] min-h-none max-h-none h-full w-10 p-none"
      >
        <div
          class="i-tabler:dots-vertical color-[var(--color-primary)] size-7.5"
        ></div>
      </button>
    </div>
  </div>
{/if}

<script lang="ts">
  import RootFolderSelector from '@/components/general/workspace_selector/index.svelte';
  import Sidebar from '@/components/sidebar_section/index.svelte';
  import GlobalContextMenu from '@/components/general/context_menu/index.svelte';
  import { Toaster } from 'svelte-sonner';
  import Main from '@/components/main_section/index.svelte';
  import AppSettings from '@/components/general/app_settings/index.svelte';
  import { drawer_open } from '@/lib/states/session/global/index.svelte';
  import { attach_window_listeners } from './lib/operations/window_listeners';
  $effect(() => {
    const detach = attach_window_listeners();
    return () => detach.then((f) => f()); // Handle the async setup/cleanup
  });
</script>

<div
  class="drawer select-none h-full lg:drawer-open selection:bg-[rgb(from_var(--color-accent)_r_g_b_/_0.2)] isolate"
>
  <RootFolderSelector />
  <AppSettings />
  <input
    id="my-drawer-3"
    type="checkbox"
    class="drawer-toggle"
    bind:checked={drawer_open.data}
  />
  <div
    class="
    drawer-content relative transition-height flex overflow-y-auto flex-col items-center h-full"
    style="padding-bottom: env(safe-area-inset-bottom);"
  >
    <Main />
  </div>
  <div class="drawer-side is-drawer-close:overflow-visible">
    <label for="my-drawer-3" aria-label="close sidebar" class="drawer-overlay"
    ></label>
    <Sidebar />
  </div>
</div>
<GlobalContextMenu />
<Toaster
  position="top-right"
  richColors
  theme="dark"
  closeButton
  toastOptions={{
    classes: {
      toast: 'mt-10',
      error: 'alert alert-error alert-soft',
      success: 'alert alert-success alert-soft',
      warning: 'alert alert-warning alert-soft',
      info: 'alert alert-info alert-soft',
    },
  }}
  duration={2000}
/>

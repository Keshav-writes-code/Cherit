<script lang="ts">
  import TextEditior from '@/components/text_editor/index.svelte';
  import RootFolderSelector from '@/components/root_folder_selector/index.svelte';
  import TitleBar from '@/components/titlebar/index.svelte';
  import Sidebar from '@/components/sidebar/index.svelte';
  import GlobalContextMenu from '@/components/context_menu/index.svelte';
  import { Toaster } from 'svelte-sonner';
  import { current_platform_type } from '@/lib/file_tree';
  import { opened_filenode } from './lib/states/ui_states.svelte';
</script>

<div
  class="drawer select-none h-full lg:drawer-open selection:bg-[rgb(from_var(--color-accent)_r_g_b_/_0.2)] isolate"
>
  <RootFolderSelector />
  <input id="my-drawer-3" type="checkbox" class="drawer-toggle" />
  <div
    class="
    {current_platform_type == 'mobile' && 'pt-10'}
    drawer-content flex overflow-y-auto flex-col items-center h-full"
  >
    <TitleBar />
    <TextEditior bind:filenode={opened_filenode.data} />
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

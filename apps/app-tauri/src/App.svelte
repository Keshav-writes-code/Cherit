<script lang="ts">
  import TextEditior from '@/components/text_editor/index.svelte';
  import RootFolderSelector from '@/components/root_folder_selector/index.svelte';
  import TitleBar from '@/components/titlebar/index.svelte';
  import Sidebar from '@/components/sidebar/index.svelte';
  import type { FileNode, RootPath } from '@/types';
  import { Toaster } from 'svelte-sonner';
  import { current_platform_type } from './misc_global_states.svelte';

  // NOTE: GLobal Variables
  let root_path: RootPath = $state();
  let opened_filenode: FileNode | undefined = $state();
</script>

<div
  class="drawer h-full lg:drawer-open selection:bg-[rgb(from_var(--color-accent)_r_g_b_/_0.2)] isolate"
>
  <RootFolderSelector bind:root_path />
  <input id="my-drawer-3" type="checkbox" class="drawer-toggle" />
  <div
    class="
    {current_platform_type == 'mobile' && 'pt-10'}
    drawer-content flex overflow-y-auto flex-col items-center h-full"
  >
    <TitleBar {root_path} filenode={opened_filenode} />
    <TextEditior bind:filenode={opened_filenode} {root_path} />
  </div>
  <div class="drawer-side is-drawer-close:overflow-visible">
    <label for="my-drawer-3" aria-label="close sidebar" class="drawer-overlay"
    ></label>
    <Sidebar bind:opened_filenode bind:root_path />
  </div>
</div>
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

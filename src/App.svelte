<script lang="ts">
  import FileManager from "@/components/file_manager/index.svelte";
  import TextEditior from "@/components/text_editor/index.svelte";
  import RootFolderSelector from "@/components/root_folder_selector/index.svelte";
  import TitleBar from "@/components/titlebar/index.svelte";
  import type { FileNode } from "@/types";
  import { Toaster } from "svelte-sonner";

  // NOTE: GLobal Variables
  let root_path: string | undefined = $state();
  let opened_filenode: FileNode | undefined = $state();
</script>

<div
  class="drawer lg:drawer-open selection:bg-[rgb(from_var(--color-accent)_r_g_b_/_0.2)] isolate"
>
  <RootFolderSelector bind:root_path />
  <input id="my-drawer-3" type="checkbox" class="drawer-toggle" />
  <div class="drawer-content flex flex-col items-center h-screen">
    <TitleBar />
    <TextEditior bind:filenode={opened_filenode} {root_path} />
  </div>
  <div class="drawer-side is-drawer-close:overflow-visible">
    <label for="my-drawer-3" aria-label="close sidebar" class="drawer-overlay"
    ></label>
    <FileManager bind:opened_filenode {root_path} />
  </div>
</div>
<Toaster
  position="top-right"
  richColors
  theme="dark"
  closeButton
  toastOptions={{
    classes: {
      toast: "mt-10",
      error: "alert alert-error alert-soft",
      success: "alert alert-success alert-soft",
      warning: "alert alert-warning alert-soft",
      info: "alert alert-info alert-soft",
    },
  }}
  duration={2000}
/>

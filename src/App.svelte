<script lang="ts">
  import FileManager from "@/components/file_manager/index.svelte";
  import TextEditior from "@/components/text_editor/index.svelte";
  import RootFolderSelector from "@/components/root_folder_selector/index.svelte";
  import TitleBar from "@/components/titlebar/index.svelte";
  import type { FileNode } from "@/types";

  // NOTE: GLobal Variables
  let root_path: string | undefined = $state();
  let opened_filenode: FileNode | undefined = $state();
</script>

<div class="drawer isolate lg:drawer-open">
  <RootFolderSelector bind:root_path />
  <input id="my-drawer-3" type="checkbox" class="drawer-toggle" />
  <div class="drawer-content flex flex-col items-center justify-center">
    <!-- Page content here -->
    <TitleBar />

    <TextEditior filenode={opened_filenode} {root_path} />
  </div>
  <div class="drawer-side">
    <label for="my-drawer-3" aria-label="close sidebar" class="drawer-overlay"
    ></label>
    <FileManager {root_path} />
  </div>
</div>

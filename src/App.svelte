<script lang="ts">
  import FileManager from "@/components/file_manager/index.svelte";
  import TextEditior from "@/components/text_editor/index.svelte";
  import { exists, BaseDirectory } from "@tauri-apps/plugin-fs";
  // when using `"withGlobalTauri": true`, you may use
  // const { exists, BaseDirectory } = window.__TAURI__.fs;

  // Check if the `$APPDATA/avatar.png` file exists
  let hel = $state(false);

  exists("avatar.png", { baseDir: BaseDirectory.Document }).then((v) => {
    console.log("Hell 2o");
    hel = v;
  });
</script>

<div class="drawer lg:drawer-open">
  <input id="my-drawer-3" type="checkbox" class="drawer-toggle" />
  <div class="drawer-content flex flex-col items-center justify-center">
    <!-- Page content here -->
    <TextEditior />
    <label for="my-drawer-3" class="btn drawer-button lg:hidden">
      Open drawer
    </label>
  </div>
  <div class="drawer-side bg-base-200">
    <label for="my-drawer-3" aria-label="close sidebar" class="drawer-overlay"
    ></label>
    <FileManager />
    {hel}
  </div>
</div>

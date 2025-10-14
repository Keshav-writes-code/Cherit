<script lang="ts">
  import FileManager from "@/components/file_manager/index.svelte";
  import TextEditior from "@/components/text_editor/index.svelte";
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
  <div class="drawer-side bg-base-200 w-80">
    <label for="my-drawer-3" aria-label="close sidebar" class="drawer-overlay"
    ></label>
    <FileManager rootPath="." />
  </div>
</div>

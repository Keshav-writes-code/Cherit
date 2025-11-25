<script lang="ts">
  import FileManager from "@/components/sidebar/file_manager/index.svelte";
  import BottomSidebar from "@/components/sidebar/bottom_sidebar.svelte";
  import type { FileNode } from "@/types";

  let {
    root_path = $bindable(),
    opened_filenode = $bindable(),
  }: {
    root_path: string | undefined;
    opened_filenode: FileNode | undefined;
  } = $props();
  let left_x: number | undefined = $state(undefined);
  let is_resizing = $state(false);
</script>

<svelte:window
  onmousemove={(e: MouseEvent) => {
    if (!is_resizing) return;
    left_x = e.clientX;
  }}
  onmouseup={() => (is_resizing = false)}
/>
<div
  style={left_x ? `width: ${left_x}px` : ""}
  class="
  {is_resizing && 'duration-0'}
  flex h-full flex-col items-start b-r-1 b-r-[color-mix(in_srgb,var(--color-base-content)_22%,black)] bg-base-200 is-drawer-close:w-0 is-drawer-open:w-64 min-w-[200px] max-w-[600px] w-80"
>
  <!-- Sidebar Content Here -->
  <div
    class="w-full h-10 min-h-10 bg-[color-mix(in_srgb,var(--color-base-content)_22%,black)]"
    data-tauri-drag-region
  ></div>
  <FileManager bind:opened_filenode bind:root_path />
  <BottomSidebar {root_path} />
  <div
    role="presentation"
    aria-hidden="true"
    onmousedown={() => (is_resizing = true)}
    ondblclick={() => (left_x = undefined)}
    class={`absolute h-full w-0.8 hover:bg-primary ${is_resizing && "bg-primary"} transition-all duration-300 cursor-row-resize right-0 z-1`}
  ></div>
</div>

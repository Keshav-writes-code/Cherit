<script lang="ts">
  import { build_file_tree } from "./build_file_tree";
  import ItemsRender from "@/components/file_manager/items_renderer.svelte";
  import { type FileNode } from "@/types";
  let {
    opened_filenode = $bindable(),
    root_path,
  }: { opened_filenode: FileNode | undefined; root_path: string | undefined } =
    $props();

  let file_tree: FileNode[] = $state([]);
  let collapsed_state: boolean = $state(true);
  async function load_tree(rootPath: string): Promise<void> {
    try {
      file_tree = await build_file_tree(rootPath);
    } catch (error) {
      console.error("Error loading file tree:", error);
      // Handle error in UI, e.g., show a message
    }
  }
  $effect(() => {
    if (!root_path) return;
    load_tree(root_path);
  });
</script>

<div class="flex h-full flex-col w-80 bg-base-200">
  <div
    class="w-full h-10 bg-[color-mix(in_srgb,var(--color-base-content)_22%,black)]"
    data-tauri-drag-region
  ></div>
  <div
    class="text-[color-mix(in_srgb,var(--color-base-content)_65%,black)] pt-1.5 flex justify-center *:h-full mb-2"
  >
    <button
      class="btn btn-ghost hover:bg-[color-mix(in_srgb,var(--color-base-content)_22%,black)] btn-sm max-h-none p-1"
      ><div class="i-tabler:edit size-5"></div>
    </button>
    <button
      class="btn btn-ghost hover:bg-[color-mix(in_srgb,var(--color-base-content)_22%,black)] btn-sm max-h-none p-1"
      ><div class="i-tabler:folder-plus size-5"></div>
    </button>
    <button
      class="btn btn-ghost hover:bg-[color-mix(in_srgb,var(--color-base-content)_22%,black)] btn-sm max-h-none p-1"
      ><div class="i-tabler:sort-ascending size-5"></div>
    </button>
    <button
      onclick={() => {
        collapsed_state = !collapsed_state;
      }}
      class="btn btn-ghost hover:bg-[color-mix(in_srgb,var(--color-base-content)_22%,black)] btn-sm max-h-none p-1"
      ><div
        class=" {collapsed_state
          ? 'i-famicons:chevron-expand'
          : 'i-famicons:chevron-collapse'} size-5"
      ></div>
    </button>
  </div>
  <ItemsRender bind:opened_filenode {collapsed_state} {file_tree} {root_path} />
</div>

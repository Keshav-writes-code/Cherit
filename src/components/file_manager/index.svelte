<script lang="ts">
  import { build_file_tree, type FileNode } from "./build_file_tree";
  import ItemsRender from "@/components/file_manager/items_renderer.svelte";

  // Reactive state for the file tree
  let file_tree: FileNode[] = $state([]);

  let { root_path }: { root_path: string | undefined } = $props();

  // Function to load the tree
  async function loadTree(rootPath: string): Promise<void> {
    try {
      file_tree = await build_file_tree(rootPath);
    } catch (error) {
      console.error("Error loading file tree:", error);
      // Handle error in UI, e.g., show a message
    }
  }
  $effect(() => {
    if (!root_path) return;
    loadTree(root_path);
  });
  $inspect(file_tree);
</script>

<div class="flex h-full flex-col w-80">
  <div
    class="w-full h-8 min-h-8 bg-neutral-content/10"
    data-tauri-drag-region
  ></div>
  <ItemsRender {file_tree} {root_path} />
</div>

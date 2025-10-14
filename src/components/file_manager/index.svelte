<script lang="ts">
  import { build_file_tree, type FileNode } from "./build_file_tree";
  import ItemsRender from "./items_render.svelte";

  // Reactive state for the file tree
  let file_tree: FileNode[] = $state([]);

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
    loadTree(".");
  });
  $inspect(file_tree);
</script>

<ItemsRender {file_tree} />

<script lang="ts">
  import type { FileNode } from "@/types";
  let {
    filenode,
    root_path,
  }: { filenode: FileNode | undefined; root_path: string | undefined } =
    $props();
  function getPathSegments(filePath: string, rootPath: string): string[] {
    const relative = filePath.replace(
      rootPath.endsWith("/") ? rootPath : rootPath + "/",
      "",
    );
    return relative.split("/").filter(Boolean);
  }
  let file_path_array: string[] = $state([]);
  $effect(() => {
    if (!filenode || !root_path) return;
    file_path_array = getPathSegments(filenode.path, root_path);
  });
</script>

<div class="breadcrumbs text-sm">
  <ul>
    {#each file_path_array as segment}
      <li><a>{segment}</a></li>
    {/each}
  </ul>
</div>
